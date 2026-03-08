import type { ReactNode } from "react";
import { HeaderPresenter } from "./presenter";

type HeaderContainerProps = {
  readonly userMenu: ReactNode;
};

export function HeaderContainer({ userMenu }: HeaderContainerProps) {
  return <HeaderPresenter appName="Spodule Dashboard" userMenu={userMenu} />;
}
