import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function clean(s: string): string {
  return s.split("").filter(c => c.charCodeAt(0) !== 0xFEFF).join("").trim();
}

export async function POST(req: NextRequest) {
  try {
    const { userId, email, groupId } = await req.json();
    if (!userId || !groupId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const origin = clean(process.env.NEXT_PUBLIC_APP_URL ?? "https://trainlog-three.vercel.app");
    const key    = clean(process.env.STRIPE_SECRET_KEY ?? "");

    const params = new URLSearchParams({
      "mode":                                                  "subscription",
      "line_items[0][price_data][currency]":                   "eur",
      "line_items[0][price_data][product_data][name]":         "Grapplr Gym",
      "line_items[0][price_data][product_data][description]":  "Coaches, class scheduling & gym analytics",
      "line_items[0][price_data][recurring][interval]":        "month",
      "line_items[0][price_data][unit_amount]":                "2900",
      "line_items[0][quantity]":                               "1",
      "metadata[type]":                                        "gym",
      "metadata[groupId]":                                     groupId,
      "metadata[userId]":                                      userId,
      "subscription_data[metadata][type]":                     "gym",
      "subscription_data[metadata][groupId]":                  groupId,
      "subscription_data[metadata][userId]":                   userId,
      "allow_promotion_codes":                                 "true",
      "success_url":  `${origin}/groups/${groupId}`,
      "cancel_url":   `${origin}/groups/${groupId}`,
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
    console.error("Gym checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
