import { Button } from "~/features/shared/components/ui/button";

type ChannelAddFormPresenterProps = {
  readonly availableChannels: readonly { id: string; name: string }[];
  readonly selectedChannelId: string;
  readonly onSelect: (channelId: string) => void;
  readonly onAdd: () => void;
  readonly isPending: boolean;
};

export function ChannelAddFormPresenter({
  availableChannels,
  selectedChannelId,
  onSelect,
  onAdd,
  isPending,
}: ChannelAddFormPresenterProps) {
  if (availableChannels.length === 0) return null;

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <label htmlFor="add-channel" className="text-sm font-medium">
          チャンネルを追加
        </label>
        <select
          id="add-channel"
          value={selectedChannelId}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">選択してください</option>
          {availableChannels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              #{ch.name}
            </option>
          ))}
        </select>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={onAdd}
        disabled={!selectedChannelId || isPending}
      >
        追加
      </Button>
    </div>
  );
}
