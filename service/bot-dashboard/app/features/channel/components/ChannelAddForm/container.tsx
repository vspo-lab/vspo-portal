import { useState } from "react";
import { useFetcher } from "react-router";
import { ActionIntent } from "../../internal/domain/action-intent";
import { ChannelAddFormPresenter } from "./presenter";

type ChannelAddFormContainerProps = {
  readonly availableChannels: readonly { id: string; name: string }[];
};

export function ChannelAddFormContainer({
  availableChannels,
}: ChannelAddFormContainerProps) {
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const fetcher = useFetcher();
  const isPending = fetcher.state !== "idle";

  const handleAdd = () => {
    if (!selectedChannelId) return;
    fetcher.submit(
      { intent: ActionIntent.ENABLE_CHANNEL, channelId: selectedChannelId },
      { method: "post" },
    );
    setSelectedChannelId("");
  };

  return (
    <ChannelAddFormPresenter
      availableChannels={availableChannels}
      selectedChannelId={selectedChannelId}
      onSelect={setSelectedChannelId}
      onAdd={handleAdd}
      isPending={isPending}
    />
  );
}
