import { Link } from "react-router";
import { AvatarFallback } from "~/features/shared/components/ui/avatar-fallback";
import { Button } from "~/features/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/features/shared/components/ui/card";
import type { GuildSummaryType } from "../../internal/domain/guild";
import { GuildSummary } from "../../internal/domain/guild";

type GuildCardPresenterProps = {
  readonly guild: GuildSummaryType;
  readonly botClientId: string;
};

export function GuildCardPresenter({
  guild,
  botClientId,
}: GuildCardPresenterProps) {
  const iconUrl = GuildSummary.iconUrl(guild);

  return (
    <Card className="transition-colors hover:border-foreground/20">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <AvatarFallback src={iconUrl} name={guild.name} size="md" />
        <CardTitle className="text-base">{guild.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {guild.botInstalled ? (
          <Link to={`/dashboard/${guild.id}`}>
            <Button variant="secondary" size="sm" className="w-full">
              設定を管理
            </Button>
          </Link>
        ) : (
          <a
            href={GuildSummary.inviteUrl(guild, botClientId)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="w-full">
              Bot を追加
            </Button>
          </a>
        )}
      </CardContent>
    </Card>
  );
}
