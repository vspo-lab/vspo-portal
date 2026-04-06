import { useStore } from "@nanostores/react";
import {
  $channelToDelete,
  closeDeleteDialog,
} from "../stores/channel-actions";

interface DeleteChannelDialogProps {
  guildId: string;
  actionUrl: string;
  translations: {
    heading: string;
    description: string;
    cancel: string;
    submit: string;
  };
}

export function DeleteChannelDialog({
  guildId,
  actionUrl,
  translations,
}: DeleteChannelDialogProps) {
  const target = useStore($channelToDelete);

  if (!target) return null;

  const heading = translations.heading.replace(
    "{channelName}",
    target.channelName,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDeleteDialog();
      }}
    >
      <div className="animate-modal-in glass mx-2 w-full max-w-md rounded-xl bg-surface-container-high/90 p-4 text-on-surface shadow-hover sm:mx-4 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10"
            aria-hidden="true"
          >
            <svg
              className="h-5 w-5 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-snug">{heading}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {translations.description}
            </p>
          </div>
        </div>

        <form method="POST" action={actionUrl}>
          <input type="hidden" name="guildId" value={guildId} />
          <input type="hidden" name="channelId" value={target.channelId} />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeDeleteDialog}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest"
            >
              {translations.cancel}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-destructive/90"
            >
              {translations.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
