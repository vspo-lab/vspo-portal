import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import type { CreatorType } from "~/features/shared";
import type { ChannelConfigType } from "../../internal/domain/channel-config";
import { ChannelConfigFormPresenter } from "./presenter";

type ChannelConfigFormContainerProps = {
  readonly channel: ChannelConfigType;
  readonly creators: readonly CreatorType[];
  readonly onClose: () => void;
};

export function ChannelConfigFormContainer({
  channel,
  creators,
  onClose,
}: ChannelConfigFormContainerProps) {
  const fetcher = useFetcher();
  const isPending = fetcher.state !== "idle";
  const wasSubmitting = useRef(false);

  useEffect(() => {
    if (isPending) {
      wasSubmitting.current = true;
    }
    if (!isPending && wasSubmitting.current) {
      wasSubmitting.current = false;
      onClose();
    }
  }, [isPending, onClose]);

  const handleSubmit = (formData: FormData) => {
    const customMemberIds = formData.getAll("customMemberIds") as string[];
    formData.set("customMembers", JSON.stringify(customMemberIds));
    formData.delete("customMemberIds");

    fetcher.submit(formData, { method: "post" });
  };

  return (
    <ChannelConfigFormPresenter
      channel={channel}
      creators={creators}
      onSubmit={handleSubmit}
      onClose={onClose}
      isPending={isPending}
    />
  );
}
