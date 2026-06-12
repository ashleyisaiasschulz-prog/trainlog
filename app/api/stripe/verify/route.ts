import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(s: string) {
  return s.split("").filter(c => c.charCodeAt(0) !== 0xFEFF).join("").trim();
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "No session" }, { status: 400 });

    const key = clean(process.env.STRIPE_SECRET_KEY ?? "");

    // Fetch the checkout session directly from Stripe REST API
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${key}` },
    });

    const session = await res.json() as {
      payment_status: string;
      metadata?: { userId?: string };
    };

    if (!res.ok || session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 400 });
    }

    const userId = session.metadata?.userId;
    if (!userId) return NextResponse.json({ error: "No userId in session" }, { status: 400 });

    const supabase = createClient(
      clean(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
      clean(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
    );

    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
