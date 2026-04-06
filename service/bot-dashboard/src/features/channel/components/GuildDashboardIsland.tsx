import { useStore } from "@nanostores/react";
import { useEffect, useMemo } from "react";
import { ClientFlashMessage } from "~/features/shared/components/ClientFlashMessage";
import type { CreatorType } from "~/features/shared/domain/creator";
import type { ChannelConfigType } from "../domain/channel-config";
import { createChannelActions } from "../hooks/useChannelActions";
import {
  openAddModal,
  openDeleteDialog,
  openEditModal,
} from "../stores/channel-actions";
import { $channels, initChannels } from "../stores/channel-data";
import { ChannelAddModal } from "./ChannelAddModal";
import { ChannelConfigModal } from "./ChannelConfigModal";
import { DeleteChannelDialog } from "./DeleteChannelDialog";

interface GuildDashboardIslandProps {
  guildId: string;
  initialChannels: ChannelConfigType[];
  creators: CreatorType[];
  translations: {
    table: {
      title: string;
      addChannel: string;
      channelName: string;
      language: string;
      members: string;
      status: string;
      actions: string;
      edit: string;
      delete: string;
      empty: string;
      active: string;
      paused: string;
    };
    config: {
      title: string;
      close: string;
      language: string;
      memberType: string;
      customMembers: string;
      selected: string;
      search: string;
      jpGroup: string;
      enGroup: string;
      selectAll: string;
      deselectAll: string;
      reset: string;
      cancel: string;
      save: string;
    };
    deleteDialog: {
      heading: string;
      description: string;
      cancel: string;
      submit: string;
    };
    addModal: {
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
    flash: {
      addSuccess: string;
      updateSuccess: string;
      deleteSuccess: string;
      resetSuccess: string;
      error: string;
    };
  };
  languageOptions: { value: string; label: string }[];
  memberTypeOptions: { value: string; label: string; description: string }[];
  langChipLabels: Record<string, string>;
  memberTypeLabels: Record<string, string>;
}

export function GuildDashboardIsland({
  guildId,
  initialChannels,
  creators,
  translations,
  languageOptions,
  memberTypeOptions,
  langChipLabels,
  memberTypeLabels,
}: GuildDashboardIslandProps) {
  const channels = useStore($channels);

  useEffect(() => {
    initChannels(initialChannels);
  }, [initialChannels]);

  const channelActions = useMemo(
    () => createChannelActions(translations.flash),
    [translations.flash],
  );

  const registeredIds = useMemo(
    () => channels.map((ch) => ch.channelId),
    [channels],
  );

  const creatorsByIds = useMemo(() => {
    const map = new Map<string, CreatorType>();
    for (const c of creators) map.set(c.id, c);
    return map;
  }, [creators]);

  const MAX_AVATARS = 5;

  return (
    <>
      <ClientFlashMessage />

      {/* Channel Table */}
      <div className="overflow-hidden rounded-2xl bg-surface-container-low">
        <div className="flex items-center justify-between bg-surface-container-low px-6 py-5 sm:px-8">
          <h3 className="font-heading text-lg font-bold text-on-surface">
            {translations.table.title}
          </h3>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-vspo-purple px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-vspo-purple/90"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {translations.table.addChannel}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full text-left"
            aria-label={translations.table.title}
          >
            <thead>
              <tr className="bg-surface-container-high text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                <th scope="col" className="px-6 py-4 sm:px-8">
                  {translations.table.channelName}
                </th>
                <th
                  scope="col"
                  className="hidden px-6 py-4 sm:table-cell sm:px-8"
                >
                  {translations.table.language}
                </th>
                <th
                  scope="col"
                  className="hidden px-6 py-4 md:table-cell sm:px-8"
                >
                  {translations.table.members}
                </th>
                <th
                  scope="col"
                  className="hidden px-6 py-4 lg:table-cell sm:px-8"
                >
                  {translations.table.status}
                </th>
                <th scope="col" className="px-6 py-4 text-right sm:px-8">
                  {translations.table.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch, i) => (
                <tr
                  key={ch.channelId}
                  className={`group transition-colors duration-200 hover:bg-surface-container-highest/30 ${
                    i % 2 === 0 ? "bg-surface" : "bg-surface-container-lowest"
                  }`}
                >
                  <td className="px-6 py-4 sm:px-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-vspo-purple/10 text-vspo-purple">
                        <svg
                          className="h-4 w-4"
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
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {ch.channelName}
                        </p>
                        <p className="text-[10px] text-on-surface-variant/60">
                          {ch.channelId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 sm:table-cell sm:px-8">
                    <span className="rounded bg-surface-container-highest px-2.5 py-1 text-[10px] font-bold text-on-surface">
                      {langChipLabels[ch.language] ?? ch.language}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-xs font-medium text-on-surface-variant md:table-cell sm:px-8">
                    {ch.memberType === "custom"
                      ? (() => {
                          const resolved = (ch.customMembers ?? [])
                            .map((id) => creatorsByIds.get(id))
                            .filter(Boolean) as CreatorType[];
                          if (resolved.length === 0)
                            return memberTypeLabels[ch.memberType];
                          const overflow =
                            (ch.customMembers?.length ?? 0) - MAX_AVATARS;
                          return (
                            <div className="flex items-center -space-x-2">
                              {resolved.slice(0, MAX_AVATARS).map((c) => (
                                <div
                                  key={c.id}
                                  className="relative h-7 w-7 shrink-0 rounded-full ring-2 ring-surface"
                                  title={c.name}
                                >
                                  {c.thumbnailUrl ? (
                                    <img
                                      src={c.thumbnailUrl}
                                      alt={c.name}
                                      width={28}
                                      height={28}
                                      className="h-7 w-7 rounded-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div
                                      className="flex h-7 w-7 items-center justify-center rounded-full bg-vspo-purple/20 text-[10px] font-bold text-vspo-purple"
                                      role="img"
                                      aria-label={c.name}
                                    >
                                      {c.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {overflow > 0 && (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-[10px] font-bold text-on-surface-variant ring-2 ring-surface">
                                  +{overflow}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      : (memberTypeLabels[ch.memberType] ?? ch.memberType)}
                  </td>
                  <td className="hidden px-6 py-4 lg:table-cell sm:px-8">
                    {ch.enabled ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-success shadow-sm shadow-success/50" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-success">
                          {translations.table.active}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-on-surface-variant/40" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">
                          {translations.table.paused}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 sm:px-8">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal({
                            channelId: ch.channelId,
                            channelName: ch.channelName,
                            language: ch.language,
                            memberType: ch.memberType,
                            customMemberIds: ch.customMembers,
                          })
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-vspo-purple"
                        aria-label={`${translations.table.edit} #${ch.channelName}`}
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openDeleteDialog({
                            channelId: ch.channelId,
                            channelName: ch.channelName,
                          })
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`${translations.table.delete} #${ch.channelName}`}
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {channels.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <svg
              className="h-12 w-12 text-on-surface-variant/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
            <p className="text-sm text-on-surface-variant">
              {translations.table.empty}
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-vspo-purple transition-colors hover:text-vspo-purple/80"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {translations.table.addChannel}
            </button>
          </div>
        )}
      </div>

      {/* Dialog islands */}
      <ChannelConfigModal
        guildId={guildId}
        creators={creators}
        translations={translations.config}
        languageOptions={languageOptions}
        memberTypeOptions={memberTypeOptions}
        onUpdate={channelActions.updateChannel}
        onReset={channelActions.resetChannel}
      />
      <DeleteChannelDialog
        guildId={guildId}
        translations={translations.deleteDialog}
        onDelete={channelActions.deleteChannel}
      />
      <ChannelAddModal
        guildId={guildId}
        registeredChannelIds={registeredIds}
        translations={translations.addModal}
        onAdd={channelActions.addChannel}
      />
    </>
  );
}
