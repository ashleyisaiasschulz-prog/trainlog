import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(s: string) {
  return s.split("").filter(c => c.charCodeAt(0) !== 0xFEFF).join("").trim();
}

function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(header.split(",").map(p => p.split("=")));
  const timestamp = parts["t"];
  const sig = parts["v1"];
  if (!timestamp || !sig) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return expected === sig;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";
  const secret = clean(process.env.STRIPE_WEBHOOK_SECRET ?? "");

  if (!verifyStripeSignature(body, sig, secret)) {
    console.error("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = JSON.parse(body) as { type: string; data: { object: any } };
  console.log("Webhook event:", event.type);

  const supabaseAdmin = createClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
    clean(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
  );

  if (event.type === "checkout.session.completed") {
    const userId = event.data.object?.metadata?.userId;
    console.log("Setting premium for userId:", userId);
    if (userId) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_premium: true })
        .eq("id", userId);
      if (error) console.error("DB error:", error.message);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const userId = event.data.object?.metadata?.userId;
    if (userId) {
      await supabaseAdmin
        .from("profiles")
        .update({ is_premium: false })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
