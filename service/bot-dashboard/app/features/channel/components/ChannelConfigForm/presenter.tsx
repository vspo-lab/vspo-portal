import type { CreatorType } from "~/features/shared";
import { Button } from "~/features/shared/components/ui/button";
import { ActionIntent } from "../../internal/domain/action-intent";
import type { ChannelConfigType } from "../../internal/domain/channel-config";
import { MemberType } from "../../internal/domain/member-type";

type ChannelConfigFormPresenterProps = {
  readonly channel: ChannelConfigType;
  readonly creators: readonly CreatorType[];
  readonly onSubmit: (formData: FormData) => void;
  readonly onClose: () => void;
  readonly isPending: boolean;
};

export function ChannelConfigFormPresenter({
  channel,
  creators,
  onSubmit,
  onClose,
  isPending,
}: ChannelConfigFormPresenterProps) {
  const memberTypeOptions = MemberType.options();
  const showCustomMembers = MemberType.requiresCustomSelection(
    channel.memberType,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            #{channel.channelName} の設定
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
          className="space-y-4"
        >
          <input
            type="hidden"
            name="intent"
            value={ActionIntent.UPDATE_CHANNEL}
          />
          <input type="hidden" name="channelId" value={channel.channelId} />

          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium">
              言語
            </label>
            <select
              id="language"
              name="language"
              defaultValue={channel.language}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">メンバータイプ</span>
            <div className="space-y-2">
              {memberTypeOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="memberType"
                    value={opt.value}
                    defaultChecked={channel.memberType === opt.value}
                    className="accent-discord"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {showCustomMembers && (
            <div className="space-y-2">
              <span className="text-sm font-medium">カスタムメンバー</span>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {creators.map((creator) => (
                  <label
                    key={creator.id}
                    className="flex items-center gap-2 rounded px-2 py-1 hover:bg-accent/50"
                  >
                    <input
                      type="checkbox"
                      name="customMemberIds"
                      value={creator.id}
                      defaultChecked={channel.customMembers?.includes(
                        creator.id,
                      )}
                      className="accent-discord"
                    />
                    {creator.thumbnailUrl && (
                      <img
                        src={creator.thumbnailUrl}
                        alt=""
                        className="h-5 w-5 rounded-full"
                      />
                    )}
                    <span className="text-sm">{creator.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" variant="discord" disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
