import { AvatarFallback } from "~/features/shared/components/ui/avatar-fallback";
import type { GuildSummaryType } from "../../internal/domain/guild";
import { GuildSummary } from "../../internal/domain/guild";

type GuildHeaderPresenterProps = {
  readonly guild: GuildSummaryType;
};

export function GuildHeaderPresenter({ guild }: GuildHeaderPresenterProps) {
  const iconUrl = GuildSummary.iconUrl(guild);

  return (
    <div className="flex items-center gap-4">
      <AvatarFallback src={iconUrl} name={guild.name} size="lg" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{guild.name}</h1>
        <p className="text-sm text-muted-foreground">チャンネル設定</p>
      </div>
    </div>
  );
}
