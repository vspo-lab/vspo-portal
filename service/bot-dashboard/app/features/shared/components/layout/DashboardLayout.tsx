import type { ReactNode } from "react";
import { Outlet } from "react-router";

type DashboardLayoutProps = {
  readonly header: ReactNode;
  readonly sidebar: ReactNode;
};

export function DashboardLayout({ header, sidebar }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <div className="flex flex-1">
        {sidebar}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
