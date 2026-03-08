import type { ReactNode } from "react";
import { Link } from "react-router";

type HeaderPresenterProps = {
  readonly appName: string;
  readonly userMenu: ReactNode;
};

export function HeaderPresenter({ appName, userMenu }: HeaderPresenterProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <Link to="/dashboard" className="text-lg font-bold">
        {appName}
      </Link>
      {userMenu}
    </header>
  );
}
