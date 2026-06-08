"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Plus, Users } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function Navbar() {
  const pathname = usePathname();
  const { profile } = useAuthStore();

  const initial = (profile?.display_name || profile?.username || "?")[0].toUpperCase();
  const profileActive = pathname === "/account";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Frosted glass bar — background extends into home-indicator safe area */}
      <div className="bg-zinc-950/90 backdrop-blur-xl border-t border-white/[0.06] safe-area-pb">
        <div className="flex items-center max-w-md mx-auto px-3 h-16">

          {/* Home */}
          <NavItem href="/dashboard" label="Home" pathname={pathname}>
            <Home />
          </NavItem>

          {/* Stats */}
          <NavItem href="/stats" label="Stats" pathname={pathname}>
            <BarChart2 />
          </NavItem>

          {/* Add button */}
          <div className="flex-1 flex justify-center">
            <Link
              href="/add"
              className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center
                         shadow-lg shadow-red-500/25 hover:bg-red-400
                         active:scale-95 transition-all duration-150"
            >
              <Plus size={22} strokeWidth={2.5} className="text-white" />
            </Link>
          </div>

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
                : "bg-zinc-800 text-zinc-400"
            }`}>
              {initial}
            </div>
            <span className={`text-[10px] font-medium tracking-wide transition-colors duration-150 ${
              profileActive ? "text-red-500" : "text-zinc-600"
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
  href, label, pathname, children,
}: {
  href: string; label: string; pathname: string; children: React.ReactNode;
}) {
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href} className="flex-1 flex flex-col items-center justify-center gap-1 py-1">
      <div className={`p-1.5 rounded-xl transition-colors duration-150 ${active ? "bg-red-500/10" : ""}`}>
        {/* Clone the icon child with size/stroke/color props */}
        {active
          ? <span className="text-red-500 [&>svg]:stroke-[2.5] [&>svg]:w-5 [&>svg]:h-5">{children}</span>
          : <span className="text-zinc-500 [&>svg]:stroke-[1.75] [&>svg]:w-5 [&>svg]:h-5">{children}</span>
        }
      </div>
      <span className={`text-[10px] font-medium tracking-wide transition-colors duration-150 ${
        active ? "text-red-500" : "text-zinc-600"
      }`}>
        {label}
      </span>
    </Link>
  );
}
