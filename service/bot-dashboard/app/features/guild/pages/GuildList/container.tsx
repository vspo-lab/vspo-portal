import type { GuildSummaryType } from "../../internal/domain/guild";
import { GuildSummary } from "../../internal/domain/guild";
import { GuildListPresenter } from "./presenter";

type GuildListContainerProps = {
  /** Already filtered to manageable guilds by ListGuildsUsecase */
  readonly guilds: readonly GuildSummaryType[];
  readonly botClientId: string;
};

export function GuildListContainer({
  guilds,
  botClientId,
}: GuildListContainerProps) {
  const { installed, notInstalled } = GuildSummary.partition(guilds);

  return (
    <GuildListPresenter
      installedGuilds={installed}
      notInstalledGuilds={notInstalled}
      botClientId={botClientId}
    />
  );
}
