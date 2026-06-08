# 🥋 TrainLog — BJJ Training Tracker

Early Access · Track your Brazilian Jiu-Jitsu progress and connect with your gym.

## Features
- **Training log** — sessions, positions, submissions (landed & received), intensity, reflections
- **Belt tracker** — promotions, time-in-belt, stripes
- **Tournaments** — match-by-match results, win rate, medals
- **Friends** — add training partners, view shared stats
- **Groups** — coaches schedule sessions (one-off + recurring), students RSVP, group chat, insights
- **Goals & streaks** — stay on track
- Installable **PWA** (add to home screen)

## Stack
Next.js 16 · TypeScript · TailwindCSS · Supabase (auth + Postgres + realtime) · Zustand · Recharts

## Setup
1. `npm install`
2. Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Run `supabase/schema.sql` in the Supabase SQL editor
4. `npm run dev`

## Deploy
See [DEPLOY.md](./DEPLOY.md) — one-click on Vercel.
