import { useStore } from "@nanostores/react";
import { useCallback, useMemo, useState } from "react";
import type { CreatorType } from "~/features/shared/domain/creator";
import {
  $channelToEdit,
  closeEditModal,
  type EditableChannel,
} from "../stores/channel-actions";

type ChannelConfigModalProps = {
  guildId: string;
  updateActionUrl?: string;
  resetActionUrl?: string;
  onUpdate?: (
    guildId: string,
    channelId: string,
    patch: { language: string; memberType: string; customMemberIds?: string[] },
  ) => void;
  onReset?: (guildId: string, channelId: string) => void;
  creators: CreatorType[];
  translations: {
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
    diffTitle: string;
    diffLanguage: string;
    diffMemberType: string;
    diffCustomMembers: string;
  };
  languageOptions: { value: string; label: string }[];
  memberTypeOptions: {
    value: string;
    label: string;
    description: string;
  }[];
};

export function ChannelConfigModal({
  guildId,
  onUpdate,
  onReset,
  creators,
  translations,
  languageOptions,
  memberTypeOptions,
}: ChannelConfigModalProps) {
  const channel = useStore($channelToEdit);

  if (!channel) return null;

  return (
    <ChannelConfigModalInner
      key={channel.channelId}
      guildId={guildId}
      channel={channel}
      onUpdate={onUpdate}
      onReset={onReset}
      creators={creators}
      translations={translations}
      languageOptions={languageOptions}
      memberTypeOptions={memberTypeOptions}
    />
  );
}

function ChannelConfigModalInner({
  guildId,
  channel,
  onUpdate,
  onReset,
  creators,
  translations,
  languageOptions,
  memberTypeOptions,
}: ChannelConfigModalProps & { channel: EditableChannel }) {
  const [language, setLanguage] = useState(channel.language);
  const [memberType, setMemberType] = useState(channel.memberType);
  const [customIds, setCustomIds] = useState<Set<string>>(
    () => new Set(channel.customMemberIds ?? []),
  );
  const [memberSearch, setMemberSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const jpCreators = useMemo(
    () => creators.filter((c) => c.memberType === "vspo_jp"),
    [creators],
  );
  const enCreators = useMemo(
    () => creators.filter((c) => c.memberType === "vspo_en"),
    [creators],
  );

  const heading = translations.title.replace(
    "{channelName}",
    channel.channelName,
  );
  const selectedLabel = translations.selected.replace(
    "{count}",
    String(customIds.size),
  );
  const isCustom = memberType === "custom";

  const diffs = useMemo(() => {
    const items: { label: string; from: string; to: string }[] = [];
    if (language !== channel.language) {
      const fromLabel =
        languageOptions.find((o) => o.value === channel.language)?.label ??
        channel.language;
      const toLabel =
        languageOptions.find((o) => o.value === language)?.label ?? language;
      items.push({
        label: translations.diffLanguage,
        from: fromLabel,
        to: toLabel,
      });
    }
    if (memberType !== channel.memberType) {
      const fromLabel =
        memberTypeOptions.find((o) => o.value === channel.memberType)?.label ??
        channel.memberType;
      const toLabel =
        memberTypeOptions.find((o) => o.value === memberType)?.label ??
        memberType;
      items.push({
        label: translations.diffMemberType,
        from: fromLabel,
        to: toLabel,
      });
    }
    if (isCustom) {
      const origIds = new Set(channel.customMemberIds ?? []);
      const added = [...customIds].filter((id) => !origIds.has(id));
      const removed = [...origIds].filter((id) => !customIds.has(id));
      if (added.length > 0 || removed.length > 0) {
        const nameOf = (id: string) =>
          creators.find((c) => c.id === id)?.name ?? id;
        const parts: string[] = [];
        if (added.length > 0) parts.push(`+${added.map(nameOf).join(", ")}`);
        if (removed.length > 0)
          parts.push(`-${removed.map(nameOf).join(", ")}`);
        items.push({
          label: translations.diffCustomMembers,
          from: String(origIds.size),
          to: `${customIds.size} (${parts.join(" / ")})`,
        });
      }
    }
    return items;
  }, [
    language,
    memberType,
    customIds,
    channel,
    languageOptions,
    memberTypeOptions,
    creators,
    translations,
  ]);

  const toggleMember = useCallback((id: string) => {
    setCustomIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleGroup = useCallback(
    (group: CreatorType[]) => {
      const groupIds = group.map((c) => c.id);
      const allChecked = groupIds.every((id) => customIds.has(id));
      setCustomIds((prev) => {
        const next = new Set(prev);
        for (const id of groupIds) {
          if (allChecked) next.delete(id);
          else next.add(id);
        }
        return next;
      });
    },
    [customIds],
  );

  const filterBySearch = useCallback(
    (c: CreatorType) =>
      !memberSearch ||
      c.name.toLowerCase().includes(memberSearch.toLowerCase()),
    [memberSearch],
  );

  const filteredJp = jpCreators.filter(filterBySearch);
  const filteredEn = enCreators.filter(filterBySearch);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeEditModal();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") closeEditModal();
      }}
    >
      <div className="animate-modal-in glass mx-2 w-full max-w-lg rounded-xl bg-surface-container-high/90 p-4 text-on-surface shadow-hover sm:mx-4 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-on-surface">
            {heading}
          </h2>
          <button
            type="button"
            onClick={closeEditModal}
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

        <div className="space-y-4">
          {/* Language */}
          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium">
              {translations.language}
            </label>
            <select
              id="language"
              name="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-md border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-on-surface"
            >
              {languageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Member type */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              {translations.memberType}
            </legend>
            <div className="space-y-2">
              {memberTypeOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg p-2 transition-all ${
                    memberType === opt.value
                      ? "bg-vspo-purple/10 ring-1 ring-vspo-purple/30"
                      : "hover:bg-surface-container-highest/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="memberType"
                    value={opt.value}
                    checked={memberType === opt.value}
                    onChange={() =>
                      setMemberType(opt.value as EditableChannel["memberType"])
                    }
                    className="mt-0.5 accent-vspo-purple"
                    aria-label={opt.label}
                  />
                  <div>
                    <span className="text-sm font-medium">{opt.label}</span>
                    <p className="text-xs text-on-surface-variant">
                      {opt.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Custom members */}
          {isCustom && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {translations.customMembers}
                </span>
                <span className="rounded-full bg-vspo-purple/10 px-2.5 py-0.5 text-xs font-medium text-vspo-purple">
                  {selectedLabel}
                </span>
              </div>

              {/* Chips */}
              {customIds.size > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {creators
                    .filter((c) => customIds.has(c.id))
                    .map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 rounded-full bg-vspo-purple/10 py-0.5 pl-1 pr-1.5 text-xs text-on-surface"
                      >
                        {c.thumbnailUrl ? (
                          <img
                            src={c.thumbnailUrl}
                            alt=""
                            className="h-4 w-4 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-container-highest text-[8px] font-medium text-on-surface-variant">
                            {c.name.charAt(0)}
                          </span>
                        )}
                        <span className="max-w-[80px] truncate">{c.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleMember(c.id)}
                          className="ml-0.5 inline-flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full text-on-surface-variant/60 transition-colors hover:bg-vspo-purple/20"
                          aria-label={`Remove ${c.name}`}
                        >
                          <svg
                            className="h-2.5 w-2.5"
                            aria-hidden="true"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    ))}
                </div>
              )}

              {/* Dropdown trigger */}
              <button
                type="button"
                onClick={() => setDropdownOpen((p) => !p)}
                className="flex w-full cursor-pointer items-center rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-left text-sm transition-colors hover:border-vspo-purple/40"
                aria-expanded={dropdownOpen}
              >
                <span className="text-on-surface-variant/60">
                  {translations.search}
                </span>
              </button>

              {/* Dropdown panel */}
              {dropdownOpen && (
                <div
                  role="listbox"
                  className="rounded-lg border border-outline-variant/20 bg-surface-container-high shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <div className="border-b border-outline-variant/10 p-2">
                    <input
                      type="search"
                      placeholder={translations.search}
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded-md border border-outline-variant/20 bg-surface-container-low py-1.5 pl-3 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-vspo-purple focus:outline-none focus:ring-1 focus:ring-vspo-purple"
                    />
                  </div>
                  <div className="max-h-48 space-y-3 overflow-y-auto p-3 sm:max-h-56">
                    <MemberGroup
                      label={translations.jpGroup}
                      creators={filteredJp}
                      allCreators={jpCreators}
                      selectedIds={customIds}
                      onToggle={toggleMember}
                      onToggleGroup={() => toggleGroup(jpCreators)}
                      selectAllLabel={translations.selectAll}
                      deselectAllLabel={translations.deselectAll}
                    />
                    <MemberGroup
                      label={translations.enGroup}
                      creators={filteredEn}
                      allCreators={enCreators}
                      selectedIds={customIds}
                      onToggle={toggleMember}
                      onToggleGroup={() => toggleGroup(enCreators)}
                      selectAllLabel={translations.selectAll}
                      deselectAllLabel={translations.deselectAll}
                    />
                  </div>
                </div>
              )}

              {/* Hidden inputs for selected members */}
              {Array.from(customIds).map((id) => (
                <input
                  key={id}
                  type="hidden"
                  name="customMemberIds"
                  value={id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Change preview */}
        {diffs.length > 0 && (
          <div className="mt-4 rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              {translations.diffTitle}
            </h3>
            <div className="space-y-1.5">
              {diffs.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-on-surface-variant">{d.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-destructive line-through">
                      {d.from}
                    </span>
                    <span
                      className="text-on-surface-variant"
                      aria-hidden="true"
                    >
                      &rarr;
                    </span>
                    <span className="font-medium text-success">{d.to}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => onReset?.(guildId, channel.channelId)}
            className="mr-auto rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest"
          >
            {translations.reset}
          </button>
          <button
            type="button"
            onClick={closeEditModal}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest"
          >
            {translations.cancel}
          </button>
          <button
            type="button"
            disabled={isCustom && customIds.size === 0}
            onClick={() =>
              onUpdate?.(guildId, channel.channelId, {
                language,
                memberType,
                customMemberIds: isCustom ? Array.from(customIds) : undefined,
              })
            }
            className="rounded-lg bg-vspo-purple px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-vspo-purple/90 disabled:opacity-50"
          >
            {translations.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberGroup({
  label,
  creators,
  allCreators,
  selectedIds,
  onToggle,
  onToggleGroup,
  selectAllLabel,
  deselectAllLabel,
}: {
  label: string;
  creators: CreatorType[];
  allCreators: CreatorType[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleGroup: () => void;
  selectAllLabel: string;
  deselectAllLabel: string;
}) {
  if (creators.length === 0) return null;

  const allChecked = allCreators.every((c) => selectedIds.has(c.id));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          {label}
        </h4>
        <button
          type="button"
          onClick={onToggleGroup}
          className="cursor-pointer text-xs font-medium text-vspo-purple transition-colors hover:text-vspo-purple/80"
        >
          {allChecked ? deselectAllLabel : selectAllLabel}
        </button>
      </div>
      <div className="space-y-0.5">
        {creators.map((c) => (
          <label
            key={c.id}
            className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all ${
              selectedIds.has(c.id)
                ? "bg-vspo-purple/10 ring-1 ring-vspo-purple/20"
                : "hover:bg-surface-container-highest/40"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(c.id)}
              onChange={() => onToggle(c.id)}
              className="shrink-0 accent-vspo-purple"
              aria-label={c.name}
            />
            {c.thumbnailUrl ? (
              <img
                src={c.thumbnailUrl}
                alt=""
                className="h-6 w-6 shrink-0 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-xs font-medium text-on-surface-variant">
                {c.name.charAt(0)}
              </span>
            )}
            <span className="truncate text-sm">{c.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
