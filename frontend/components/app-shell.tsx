import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardSidebar />
      <main className="min-h-screen px-4 pb-8 pt-24 sm:px-6 md:pl-[17.5rem] md:pr-8 md:pt-8 lg:pr-10">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8">{children}</div>
      </main>
    </>
  );
}
