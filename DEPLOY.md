# TrainLog — Deployment Guide

Ship the app to test users in ~15 minutes.

## 0. Prerequisites
- A GitHub account
- A Vercel account (free) — sign up with GitHub at vercel.com
- Your Supabase project (already set up)

---

## 1. Run the database schema (ONCE)

In Supabase → **SQL Editor** → **New query** → paste the full contents of
`supabase/schema.sql` → **Run**.

You should see `Schema ready ✓`.

Then under **Authentication → Providers → Email**, turn **"Confirm email" OFF**
(so testers can log in instantly without an email link).

---

## 2. Push the code to GitHub

From the `trainlog/` folder:

```bash
git init
git add .
git commit -m "TrainLog with Supabase social features"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/trainlog.git
git push -u origin main
```

(Create the empty repo first on github.com → New repository → name it `trainlog`,
keep it **Private**.)

> `.env.local` is gitignored — your Supabase keys will NOT be pushed. Good.

---

## 3. Deploy on Vercel

1. vercel.com → **Add New → Project**
2. Import your `trainlog` repo
3. Before deploying, open **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://makclrrzmhpljfreiyyg.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(the long key from your .env.local)* |

4. Click **Deploy** → wait ~1 min → you get a URL like `trainlog-xyz.vercel.app`

---

## 4. Point Supabase at the live URL

Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://trainlog-xyz.vercel.app`
- **Redirect URLs**: add `https://trainlog-xyz.vercel.app/**`

---

## 5. Share with testers

Send the Vercel link. On a phone:
- Open in Safari/Chrome
- **Share → Add to Home Screen** → behaves like a native app

Each tester registers their own account. Trainers tick the "I'm a Trainer"
toggle on signup to unlock group creation.

---

## Updating later
Every `git push` to `main` auto-deploys a new version on Vercel.
