import { useState } from "react";
import type { CreatorType } from "~/features/shared";
import { ChannelConfigFormContainer } from "../../components/ChannelConfigForm/container";
import { ChannelTableContainer } from "../../components/ChannelTable/container";
import type { ChannelConfigType } from "../../internal/domain/channel-config";
import { GuildDetailPresenter } from "./presenter";

type GuildDetailContainerProps = {
  readonly guildId: string;
  readonly guildName: string;
  readonly channels: readonly ChannelConfigType[];
  readonly creators: readonly CreatorType[];
};

export function GuildDetailContainer({
  guildId,
  guildName,
  channels,
  creators,
}: GuildDetailContainerProps) {
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const editingChannel = channels.find(
    (ch) => ch.channelId === editingChannelId,
  );

  const enabledCount = channels.filter((ch) => ch.enabled).length;

  return (
    <GuildDetailPresenter
      guildName={guildName}
      channelCount={channels.length}
      enabledCount={enabledCount}
      channelTable={
        <ChannelTableContainer
          channels={channels}
          guildId={guildId}
          onEdit={setEditingChannelId}
        />
      }
      configForm={
        editingChannel ? (
          <ChannelConfigFormContainer
            channel={editingChannel}
            creators={creators}
            onClose={() => setEditingChannelId(null)}
          />
        ) : null
      }
    />
  );
}
