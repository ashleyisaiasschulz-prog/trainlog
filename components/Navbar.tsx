"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Building2, Users } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGymStore } from "@/store/useGymStore";

export default function Navbar() {
  const pathname = usePathname();
  const { profile } = useAuthStore();
  const gymIds = useGymStore((s) => s.gymIds);

  // With exactly one gym, link the tab straight to it — no redirect hop.
  const gymHref = gymIds.length === 1 ? `/groups/${gymIds[0]}` : "/groups";

  const initial = (profile?.display_name || profile?.username || "?")[0].toUpperCase();
  const profileActive = pathname === "/account";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Frosted glass bar — adapts to dark/light mode */}
      <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-black/[0.08] dark:border-white/[0.06] safe-area-pb">
        <div className="flex items-center max-w-md mx-auto px-3 h-16">

          {/* Home */}
          <NavItem href="/dashboard" label="Home" pathname={pathname}>
            <Home />
          </NavItem>

          {/* Stats */}
          <NavItem href="/stats" label="Stats" pathname={pathname}>
            <BarChart2 />
          </NavItem>

          {/* Gym / Groups */}
          <NavItem href={gymHref} label="Gym" pathname={pathname} activeMatch="/groups">
            <Building2 />
          </NavItem>

          {/* Friends */}
          <NavItem href="/friends" label="Friends" pathname={pathname}>
            <Users />
          </NavItem>

          {/* Profile avatar */}
          <Link
            href="/account"
            className="flex-1 flex flex-col items-center justify-center gap-1 py-1"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150 ${
              profileActive
                ? "bg-red-500 text-white"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            }`}>
              {initial}
            </div>
            <span className={`text-[10px] font-medium tracking-wide transition-colors duration-150 ${
              profileActive ? "text-red-500" : "text-zinc-500 dark:text-zinc-600"
            }`}>
              Profile
            </span>
          </Link>

        </div>
      </div>
    </nav>
  );
}

function NavItem({
  href, label, pathname, children, activeMatch,
}: {
  href: string; label: string; pathname: string; children: React.ReactNode; activeMatch?: string;
}) {
  const base = activeMatch ?? href;
  const active = pathname === base || pathname.startsWith(base + "/");
  return (
    <Link href={href} className="flex-1 flex flex-col items-center justify-center gap-1 py-1">
      <div className={`p-1.5 rounded-xl transition-colors duration-150 ${active ? "bg-red-500/10" : ""}`}>
        {/* Clone the icon child with size/stroke/color props */}
        {active
          ? <span className="text-red-500 [&>svg]:stroke-[2.5] [&>svg]:w-5 [&>svg]:h-5">{children}</span>
          : <span className="text-zinc-400 dark:text-zinc-500 [&>svg]:stroke-[1.75] [&>svg]:w-5 [&>svg]:h-5">{children}</span>
        }
      </div>
      <span className={`text-[10px] font-medium tracking-wide transition-colors duration-150 ${
        active ? "text-red-500" : "text-zinc-500 dark:text-zinc-600"
      }`}>
        {label}
      </span>
    </Link>
  );
}
