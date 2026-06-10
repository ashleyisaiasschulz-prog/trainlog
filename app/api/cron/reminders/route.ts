import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { format, addDays, startOfDay } from "date-fns";

// Called by Vercel Cron daily at 08:00 UTC
// Sends push reminders for sessions scheduled today

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized calls
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role key — bypasses RLS to read all users' schedules
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const todayDow = new Date().getDay(); // 0=Sun … 6=Sat

  // Get all active schedules for today
  const { data: schedules } = await sb
    .from("schedules")
    .select("user_id, name, time, duration, gi")
    .eq("active", true)
    .or(`and(type.eq.recurring,day_of_week.eq.${todayDow}),and(type.eq.once,date.eq.${today})`);

  if (!schedules?.length) return NextResponse.json({ sent: 0 });

  // Get push subscriptions for those users
  const userIds = [...new Set(schedules.map((s: any) => s.user_id))];
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("user_id, endpoint, keys")
    .in("user_id", userIds);

  let sent = 0;
  for (const sub of (subs ?? [])) {
    const userSchedules = schedules.filter((s: any) => s.user_id === sub.user_id);
    for (const s of userSchedules) {
      const title = "Training today 🥋";
      const body = `${s.name} · ${s.time} · ${s.gi ? "Gi" : "No-Gi"}`;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify({ title, body, url: "/dashboard" })
        );
        sent++;
      } catch {
        // Subscription expired → delete it
        await sb.from("push_subscriptions")
          .delete().eq("endpoint", sub.endpoint);
      }
    }
  }

  return NextResponse.json({ sent });
}
