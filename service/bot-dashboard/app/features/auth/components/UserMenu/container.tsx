import type { DiscordUserType } from "../../internal/domain/discord-user";
import { DiscordUser } from "../../internal/domain/discord-user";
import { UserMenuPresenter } from "./presenter";

type UserMenuContainerProps = {
  readonly user: DiscordUserType;
};

export function UserMenuContainer({ user }: UserMenuContainerProps) {
  const avatarUrl = DiscordUser.avatarUrl(user);
  return (
    <UserMenuPresenter
      displayName={user.displayName}
      avatarUrl={avatarUrl}
      logoutAction="/auth/logout"
    />
  );
}
