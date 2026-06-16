import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Remove BOM/whitespace that PowerShell may inject into piped env vars
function clean(s: string): string {
  return s.split("").filter(c => c.charCodeAt(0) !== 0xFEFF).join("").trim();
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const origin = clean(process.env.NEXT_PUBLIC_APP_URL ?? "https://trainlog-three.vercel.app");
    const key    = clean(process.env.STRIPE_SECRET_KEY ?? "");

    const supabaseAdmin = createClient(
      clean(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
      clean(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
    );

    // Find the stored Stripe customer id
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    let customerId: string | null = profile?.stripe_customer_id ?? null;

    // Fallback: look the customer up by the auth email if we never stored it
    if (!customerId) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = authUser?.user?.email;
      if (email) {
        const lookup = await fetch(
          `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`,
          { headers: { "Authorization": `Bearer ${key}` } }
        );
        const list = await lookup.json() as { data?: { id: string }[] };
        customerId = list.data?.[0]?.id ?? null;
        if (customerId) {
          await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
        }
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const params = new URLSearchParams({
      customer:   customerId,
      return_url: `${origin}/account`,
    });

    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
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
    console.error("Portal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
