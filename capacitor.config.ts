import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Grapplr native shell (iOS + Android).
 *
 * The app is a server-rendered Next.js app (SSR + API routes), so the native
 * build loads the hosted production site instead of a static export. The
 * `www/` folder is only an offline fallback shown when there is no network.
 *
 * To point at a different domain (e.g. a custom domain later), change
 * `server.url` below and run `npx cap sync`.
 */
const config: CapacitorConfig = {
  appId: "app.grapplr.mobile",
  appName: "Grapplr",
  webDir: "www",
  server: {
    url: "https://trainlog-three.vercel.app",
    cleartext: false,
  },
  backgroundColor: "#09090b",
  ios: {
    contentInset: "always",
  },
};

export default config;
