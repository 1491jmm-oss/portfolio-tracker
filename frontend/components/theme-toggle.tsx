"use client";

import { Laptop, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex rounded-md border border-border bg-muted/60 p-0.5">
      {themes.map((item) => {
        const Icon = item.icon;
        const isActive = theme === item.value;

        return (
          <button
            key={item.value}
            type="button"
            title={item.label}
            aria-label={`Use ${item.label} theme`}
            onClick={() => setTheme(item.value)}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground",
              isActive && "bg-card text-foreground shadow-sm",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
