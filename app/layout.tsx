import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import DevSwitcher from "@/components/DevSwitcher";
import PWARegister from "@/components/PWARegister";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Grapplr – BJJ Training Tracker",
  description: "Track your Brazilian Jiu-Jitsu progress. Connect with your gym.",
  applicationName: "Grapplr",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Grapplr",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <head>
        {/* Apply saved theme before render to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var t = localStorage.getItem('theme');
            if(t !== 'light') document.documentElement.classList.add('dark');
          })();
        `}} />
      </head>
      <body className="min-h-full bg-zinc-950 text-zinc-100 dark:bg-zinc-950 dark:text-zinc-100">
        <AuthProvider>{children}</AuthProvider>
        <DevSwitcher />
        <PWARegister />
      </body>
    </html>
  );
}
