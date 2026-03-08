import { GuildCardPresenter } from "../../components/GuildCard/presenter";
import type { GuildSummaryType } from "../../internal/domain/guild";

type GuildListPresenterProps = {
  readonly installedGuilds: readonly GuildSummaryType[];
  readonly notInstalledGuilds: readonly GuildSummaryType[];
  readonly botClientId: string;
};

export function GuildListPresenter({
  installedGuilds,
  notInstalledGuilds,
  botClientId,
}: GuildListPresenterProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">サーバー一覧</h1>
        <p className="text-muted-foreground">
          Bot が導入されているサーバーの設定を管理できます。
        </p>
      </div>

      {installedGuilds.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Bot 導入済み</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {installedGuilds.map((guild) => (
              <GuildCardPresenter
                key={guild.id}
                guild={guild}
                botClientId={botClientId}
              />
            ))}
          </div>
        </section>
      )}

      {notInstalledGuilds.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Bot 未導入
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notInstalledGuilds.map((guild) => (
              <GuildCardPresenter
                key={guild.id}
                guild={guild}
                botClientId={botClientId}
              />
            ))}
          </div>
        </section>
      )}

      {installedGuilds.length === 0 && notInstalledGuilds.length === 0 && (
        <p className="text-muted-foreground">
          管理権限を持つサーバーがありません。
        </p>
      )}
    </div>
  );
}
