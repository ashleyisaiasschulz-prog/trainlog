import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(s: string) {
  return s.split("").filter(c => c.charCodeAt(0) !== 0xFEFF).join("").trim();
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json() as { username: string };
    if (!username) return NextResponse.json({ error: "No username" }, { status: 400 });

    const supabase = createClient(
      clean(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
      clean(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
    );

    // Look up the profile id by username
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username.trim())
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get auth user to retrieve email
    const { data: { user }, error: authErr } = await supabase.auth.admin.getUserById(profile.id);
    if (authErr || !user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ email: user.email });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
