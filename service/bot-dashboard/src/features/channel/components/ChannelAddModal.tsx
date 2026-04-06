import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { $showAddModal, closeAddModal } from "../stores/channel-actions";

interface Channel {
  id: string;
  name: string;
}

interface ChannelAddModalProps {
  guildId: string;
  actionUrl: string;
  registeredChannelIds: string[];
  translations: {
    title: string;
    search: string;
    loading: string;
    error: string;
    empty: string;
    submit: string;
    registered: string;
    cancel: string;
    close: string;
  };
}

export function ChannelAddModal({
  guildId,
  actionUrl,
  registeredChannelIds,
  translations,
}: ChannelAddModalProps) {
  const isOpen = useStore($showAddModal);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const channelIdRef = useRef<HTMLInputElement>(null);
  const registeredSet = useMemo(
    () => new Set(registeredChannelIds),
    [registeredChannelIds],
  );

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setLoading(true);
    setError(false);
    fetch(`/api/guilds/${guildId}/channels`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: Channel[]) => {
        setChannels(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [isOpen, guildId]);

  const filtered = useMemo(() => {
    if (!search) return channels;
    const q = search.toLowerCase();
    return channels.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [channels, search]);

  const handleSelect = useCallback(
    (channelId: string) => {
      if (channelIdRef.current && formRef.current) {
        channelIdRef.current.value = channelId;
        formRef.current.requestSubmit();
      }
    },
    [],
  );

  if (!isOpen) return null;

  const unregistered = filtered.filter((ch) => !registeredSet.has(ch.id));
  const registered = filtered.filter((ch) => registeredSet.has(ch.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={translations.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAddModal();
      }}
    >
      <div className="animate-modal-in glass mx-2 w-full max-w-lg rounded-xl bg-surface-container-high/90 p-4 text-on-surface shadow-hover sm:mx-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-on-surface">
            {translations.title}
          </h2>
          <button
            type="button"
            onClick={closeAddModal}
            className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-highest"
            aria-label={translations.close}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="channel-search" className="sr-only">
            {translations.search}
          </label>
          <input
            id="channel-search"
            type="search"
            placeholder={translations.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-vspo-purple focus:outline-none focus:ring-1 focus:ring-vspo-purple"
          />
        </div>

        {loading && (
          <div className="py-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-vspo-purple border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="py-8 text-center text-sm text-error">
            {translations.error}
          </p>
        )}

        {!loading && !error && channels.length === 0 && (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            {translations.empty}
          </p>
        )}

        {!loading && !error && channels.length > 0 && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            {translations.empty}
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div
            className="max-h-64 space-y-1 overflow-y-auto"
            role="listbox"
            aria-label={translations.title}
          >
            {unregistered.map((ch) => (
              <button
                key={ch.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(ch.id)}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition-colors hover:bg-surface-container-highest/30"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0 text-on-surface-variant"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    />
                  </svg>
                  <span>{ch.name}</span>
                </span>
                <span className="text-xs font-medium text-vspo-purple">
                  {translations.submit}
                </span>
              </button>
            ))}
            {registered.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-on-surface-variant/50"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    />
                  </svg>
                  <span>{ch.name}</span>
                </span>
                <span className="text-xs">{translations.registered}</span>
              </div>
            ))}
          </div>
        )}

        <form
          ref={formRef}
          method="POST"
          action={actionUrl}
          className="hidden"
        >
          <input type="hidden" name="guildId" value={guildId} />
          <input type="hidden" name="channelId" value="" ref={channelIdRef} />
        </form>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={closeAddModal}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest"
          >
            {translations.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
