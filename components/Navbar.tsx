"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Plus, Trophy, Award } from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: Home,     label: "Home"  },
  { href: "/belt",      icon: Award,    label: "Belt"  },
  null,
  { href: "/tournaments", icon: Trophy, label: "Comps" },
  { href: "/stats",     icon: BarChart2, label: "Stats" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Frosted glass bar — background extends into home-indicator safe area */}
      <div className="bg-zinc-950/90 backdrop-blur-xl border-t border-white/[0.06] safe-area-pb">
        <div className="flex items-center max-w-md mx-auto px-3 h-16">
          {NAV.map((item, i) => {
            if (!item) {
              return (
                <div key="add" className="flex-1 flex justify-center">
                  <Link
                    href="/add"
                    className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center
                               shadow-lg shadow-red-500/25 hover:bg-red-400
                               active:scale-95 transition-all duration-150"
                  >
                    <Plus size={22} strokeWidth={2.5} className="text-white" />
                  </Link>
                </div>
              );
            }

            const { href, icon: Icon, label } = item;
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-1"
              >
                <div className={`p-1.5 rounded-xl transition-colors duration-150 ${
                  active ? "bg-red-500/10" : ""
                }`}>
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.75}
                    className={`transition-colors duration-150 ${
                      active ? "text-red-500" : "text-zinc-500"
                    }`}
                  />
                </div>
                <span className={`text-[10px] font-medium tracking-wide transition-colors duration-150 ${
                  active ? "text-red-500" : "text-zinc-600"
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
