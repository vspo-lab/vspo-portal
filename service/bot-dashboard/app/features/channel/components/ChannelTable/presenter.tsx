import type { ChannelConfigType } from "../../internal/domain/channel-config";
import { MemberType } from "../../internal/domain/member-type";

type ChannelTablePresenterProps = {
  readonly channels: readonly ChannelConfigType[];
  readonly onToggle: (channelId: string, enabled: boolean) => void;
  readonly onEdit: (channelId: string) => void;
  readonly isPending: boolean;
};

export function ChannelTablePresenter({
  channels,
  onToggle,
  onEdit,
  isPending,
}: ChannelTablePresenterProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">チャンネル</th>
            <th className="px-4 py-3 text-left font-medium">有効</th>
            <th className="px-4 py-3 text-left font-medium">言語</th>
            <th className="px-4 py-3 text-left font-medium">メンバー</th>
            <th className="px-4 py-3 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((ch) => (
            <tr
              key={ch.channelId}
              className="border-b border-border last:border-0"
            >
              <td className="px-4 py-3 font-medium">#{ch.channelName}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onToggle(ch.channelId, !ch.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    ch.enabled ? "bg-discord" : "bg-muted"
                  } ${isPending ? "opacity-50" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      ch.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {ch.language.toUpperCase()}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {MemberType.label(ch.memberType)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(ch.channelId)}
                  className="rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  編集
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {channels.length === 0 && (
        <p className="p-6 text-center text-muted-foreground">
          設定されたチャンネルがありません。
        </p>
      )}
    </div>
  );
}
