import type { ReactNode } from "react";

type GuildDetailPresenterProps = {
  readonly guildName: string;
  readonly channelCount: number;
  readonly enabledCount: number;
  readonly channelTable: ReactNode;
  readonly configForm: ReactNode;
};

export function GuildDetailPresenter({
  guildName,
  channelCount,
  enabledCount,
  channelTable,
  configForm,
}: GuildDetailPresenterProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{guildName}</h1>
        <p className="text-muted-foreground">
          {enabledCount}/{channelCount} チャンネルで有効
        </p>
      </div>
      {channelTable}
      {configForm}
    </div>
  );
}
