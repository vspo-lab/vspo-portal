import { useFetcher } from "react-router";
import { ActionIntent } from "../../internal/domain/action-intent";
import type { ChannelConfigType } from "../../internal/domain/channel-config";
import { ChannelTablePresenter } from "./presenter";

type ChannelTableContainerProps = {
  readonly channels: readonly ChannelConfigType[];
  readonly guildId: string;
  readonly onEdit: (channelId: string) => void;
};

export function ChannelTableContainer({
  channels,
  guildId,
  onEdit,
}: ChannelTableContainerProps) {
  const fetcher = useFetcher();
  const isPending = fetcher.state !== "idle";

  const handleToggle = (channelId: string, enabled: boolean) => {
    fetcher.submit(
      {
        intent: enabled
          ? ActionIntent.ENABLE_CHANNEL
          : ActionIntent.DISABLE_CHANNEL,
        channelId,
      },
      { method: "post" },
    );
  };

  // Optimistic UI: pending の場合は fetcher data を反映
  const optimisticChannels =
    fetcher.formData && fetcher.formData.get("intent")
      ? channels.map((ch) => {
          if (ch.channelId === fetcher.formData?.get("channelId")) {
            const intent = fetcher.formData?.get("intent");
            return {
              ...ch,
              enabled: intent === ActionIntent.ENABLE_CHANNEL,
            };
          }
          return ch;
        })
      : channels;

  return (
    <ChannelTablePresenter
      channels={optimisticChannels}
      onToggle={handleToggle}
      onEdit={onEdit}
      isPending={isPending}
    />
  );
}
