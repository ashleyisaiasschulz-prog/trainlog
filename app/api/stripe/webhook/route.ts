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

  const meta = event.data.object?.metadata ?? {};
  const isGymSub = meta.type === "gym";

  if (event.type === "checkout.session.completed") {
    const userId = meta.userId;
    const customerId = event.data.object?.customer ?? null;
    if (isGymSub) {
      // Gym subscription → unlock the group (if it already exists; the new-gym
      // group is created in verify-gym on return) and grant the owner Pro.
      if (meta.groupId) {
        const { error } = await supabaseAdmin
          .from("groups")
          .update({ is_gym: true })
          .eq("id", meta.groupId);
        if (error) console.error("Gym unlock error:", error.message);
      }
      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ is_premium: true, stripe_customer_id: customerId })
          .eq("id", userId);
      }
    } else if (userId) {
      // Personal Pro subscription
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_premium: true, stripe_customer_id: customerId })
        .eq("id", userId);
      if (error) console.error("DB error:", error.message);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    if (isGymSub && meta.groupId) {
      await supabaseAdmin.from("groups").update({ is_gym: false }).eq("id", meta.groupId);
    } else if (meta.userId) {
      await supabaseAdmin.from("profiles").update({ is_premium: false }).eq("id", meta.userId);
    }
  }

  return NextResponse.json({ received: true });
}
