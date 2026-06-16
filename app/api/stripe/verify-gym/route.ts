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

    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${key}` },
    });
    const session = await res.json() as {
      payment_status: string;
      metadata?: { type?: string; groupId?: string; gymName?: string; userId?: string };
    };

    if (!res.ok || session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 400 });
    }
    if (session.metadata?.type !== "gym") {
      return NextResponse.json({ error: "Not a gym checkout" }, { status: 400 });
    }

    const supabase = createClient(
      clean(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
      clean(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
    );

    const ownerId = session.metadata.userId;
    // Gym owners get Pro included for as long as the gym subscription runs.
    const grantPro = async () => {
      if (!ownerId) return;
      await supabase.from("profiles").update({ is_premium: true }).eq("id", ownerId);
    };

    // Upgrade path: existing group → flip is_gym
    if (session.metadata.groupId) {
      const { error } = await supabase
        .from("groups")
        .update({ is_gym: true })
        .eq("id", session.metadata.groupId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await grantPro();
      return NextResponse.json({ success: true, groupId: session.metadata.groupId });
    }

    // New-gym path: create the group as a gym + add owner as trainer member
    if (session.metadata.gymName && ownerId) {
      const { data: g, error: gErr } = await supabase
        .from("groups")
        .insert({ name: session.metadata.gymName, trainer_id: ownerId, is_gym: true })
        .select("id")
        .single();
      if (gErr || !g) return NextResponse.json({ error: gErr?.message ?? "create failed" }, { status: 500 });

      const { error: mErr } = await supabase
        .from("group_members")
        .insert({ group_id: g.id, user_id: ownerId, role: "trainer" });
      if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

      await grantPro();
      return NextResponse.json({ success: true, groupId: g.id });
    }

    return NextResponse.json({ error: "Not a gym checkout" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
