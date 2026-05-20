"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CircleDot, LineChart, Settings, WalletCards } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/", icon: BarChart3, comingSoon: false },
  { label: "Analytics", href: "/analytics", icon: LineChart, comingSoon: true },
  { label: "Operations", href: "/operations", icon: WalletCards, comingSoon: false },
  { label: "Settings", href: "/settings", icon: Settings, comingSoon: true },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-x-0 top-0 z-30 border-b border-border bg-background/90 backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-16 items-center justify-between px-4 md:h-full md:flex-col md:items-stretch md:justify-start md:px-3 md:py-4">
        <div className="flex items-center gap-3 px-1 md:px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card">
            <CircleDot className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Portfolio Tracker</p>
            <p className="hidden text-xs text-muted-foreground md:block">Private dashboard</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto md:mt-8 md:flex-col md:items-stretch md:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const className = cn(
              "group flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              item.comingSoon && "cursor-not-allowed opacity-45 hover:bg-transparent",
            );

            const content = (
              <>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.comingSoon ? (
                  <span className="ml-auto hidden rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-normal text-muted-foreground md:inline">
                    Soon
                  </span>
                ) : null}
              </>
            );

            if (item.comingSoon) {
              return (
                <button key={item.label} type="button" disabled className={className}>
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
