import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Remove BOM (0xFEFF) and whitespace PowerShell injects into piped env vars
function clean(s: string): string {
  return s.split("").filter(c => c.charCodeAt(0) !== 0xFEFF).join("").trim();
}

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const origin = clean(process.env.NEXT_PUBLIC_APP_URL ?? "https://trainlog-three.vercel.app");
    const key    = clean(process.env.STRIPE_SECRET_KEY ?? "");

    const params = new URLSearchParams({
      "mode":                                                  "subscription",
      "line_items[0][price_data][currency]":                   "eur",
      "line_items[0][price_data][product_data][name]":         "Grapplr Premium",
      "line_items[0][price_data][product_data][description]":  "Turniere, Freunde & Statistiken",
      "line_items[0][price_data][recurring][interval]":        "month",
      "line_items[0][price_data][unit_amount]":                "500",
      "line_items[0][quantity]":                               "1",
      "metadata[userId]":                                      userId,
      "subscription_data[metadata][userId]":                   userId,
      "allow_promotion_codes":                                 "true",
      "success_url":  `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url":   `${origin}/account`,
      "locale":       "de",
    });

    if (email) params.set("customer_email", email);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type":  "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json() as { url?: string; error?: { message: string } };

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message ?? "Stripe error" }, { status: 500 });
    }

    return NextResponse.json({ url: data.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
