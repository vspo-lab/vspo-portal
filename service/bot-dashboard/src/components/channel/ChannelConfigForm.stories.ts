import type { Meta, StoryObj } from "@storybook/html";

type Channel = {
  channelId: string;
  channelName: string;
  enabled: boolean;
  language: string;
  memberType: string;
  customMembers?: string[];
};

type Creator = {
  id: string;
  name: string;
  memberType: string;
  thumbnailUrl: string | null;
};

type ChannelConfigFormArgs = {
  channel: Channel;
  creators: Creator[];
  guildId: string;
};

const closeIcon = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;

const memberTypeOptions: { value: string; label: string; desc: string }[] = [
  {
    value: "vspo_jp",
    label: "VSPO! JP",
    desc: "Notifications for VSPO! JP members only",
  },
  {
    value: "vspo_en",
    label: "VSPO! EN",
    desc: "Notifications for VSPO! EN members only",
  },
  {
    value: "all",
    label: "All Members",
    desc: "Notifications for all VSPO! members",
  },
  {
    value: "custom",
    label: "Custom",
    desc: "Select specific members to receive notifications",
  },
];

const meta: Meta<ChannelConfigFormArgs> = {
  title: "Channel/ChannelConfigForm",
  render: (args) => {
    const showCustomMembers = args.channel.memberType === "custom";
    const customMemberSet = new Set(args.channel.customMembers ?? []);

    const radioItems = memberTypeOptions
      .map(
        (opt) => `
      <label class="flex cursor-pointer items-start gap-2 rounded-lg p-2 transition-all ${args.channel.memberType === opt.value ? "bg-vspo-purple/10 ring-1 ring-vspo-purple/30" : "hover:bg-surface-container-highest/50"}" data-radio-label>
        <input type="radio" name="memberType" value="${opt.value}" ${args.channel.memberType === opt.value ? "checked" : ""} class="mt-0.5 accent-vspo-purple" />
        <div>
          <span class="text-sm font-medium">${opt.label}</span>
          <p class="text-xs text-on-surface-variant">${opt.desc}</p>
        </div>
      </label>`,
      )
      .join("");

    const memberRow = (creator: Creator) => {
      const checked = customMemberSet.has(creator.id);
      const highlight = checked
        ? "bg-vspo-purple/10 ring-1 ring-vspo-purple/20"
        : "hover:bg-surface-container-highest/40";
      return `
        <label class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all ${highlight}" data-member-item data-member-name="${creator.name.toLowerCase()}">
          <input type="checkbox" name="customMemberIds" value="${creator.id}" ${checked ? "checked" : ""} class="shrink-0 accent-vspo-purple" data-member-checkbox />
          ${creator.thumbnailUrl ? `<img src="${creator.thumbnailUrl}" alt="" class="h-6 w-6 shrink-0 rounded-full object-cover" />` : `<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-xs font-medium text-on-surface-variant">${creator.name.charAt(0)}</span>`}
          <span class="truncate text-sm">${creator.name}</span>
        </label>`;
    };

    const selectedCount = customMemberSet.size;

    const chipHtml = (creator: Creator) => `
      <span data-chip="${creator.id}" class="inline-flex items-center gap-1 rounded-full bg-vspo-purple/10 py-0.5 pl-1 pr-1.5 text-xs text-on-surface">
        ${creator.thumbnailUrl ? `<img src="${creator.thumbnailUrl}" alt="" class="h-4 w-4 rounded-full object-cover" />` : `<span class="flex h-4 w-4 items-center justify-center rounded-full bg-surface-container-highest text-[8px] font-medium text-on-surface-variant">${creator.name.charAt(0)}</span>`}
        <span class="max-w-[80px] truncate">${creator.name}</span>
        <button type="button" class="ml-0.5 inline-flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full text-on-surface-variant/60 hover:bg-vspo-purple/20 hover:text-on-surface" data-remove-chip="${creator.id}" aria-label="Remove ${creator.name}">
          <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </span>`;

    const selectedChips = args.creators
      .filter((c) => customMemberSet.has(c.id))
      .map(chipHtml)
      .join("");
    const hasChips = selectedCount > 0;

    return `
      <dialog open class="fixed inset-0 z-50 flex items-center justify-center" id="config-modal" aria-labelledby="config-modal-heading" aria-modal="true" style="background: rgba(0,0,0,0.6);">
        <div class="glass mx-4 w-full max-w-lg rounded-xl bg-surface-container-high/90 p-6 text-on-surface shadow-hover">
          <div class="mb-4 flex items-center justify-between">
            <h2 id="config-modal-heading" class="font-heading text-lg font-bold text-on-surface">#${args.channel.channelName} Settings</h2>
            <button type="button" class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface" aria-label="Close">${closeIcon}</button>
          </div>
          <form class="space-y-4">
            <input type="hidden" name="guildId" value="${args.guildId}" />
            <input type="hidden" name="channelId" value="${args.channel.channelId}" />
            <div class="space-y-2">
              <label for="language" class="text-sm font-medium">Language</label>
              <select id="language" name="language" class="w-full rounded-md border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-on-surface">
                <option value="ja" ${args.channel.language === "ja" ? "selected" : ""}>Japanese</option>
                <option value="en" ${args.channel.language === "en" ? "selected" : ""}>English</option>
                <option value="default" ${args.channel.language === "default" ? "selected" : ""}>Default</option>
              </select>
            </div>
            <fieldset class="space-y-2">
              <legend class="text-sm font-medium">Member Type</legend>
              <div class="space-y-2">${radioItems}</div>
            </fieldset>
            <div class="space-y-3 overflow-hidden transition-all duration-200 ${showCustomMembers ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}" data-custom-members aria-hidden="${!showCustomMembers}">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">Custom Members</span>
                <span class="rounded-full bg-vspo-purple/10 px-2.5 py-0.5 text-xs font-medium text-vspo-purple" data-selected-count>${selectedCount} selected</span>
              </div>
              <div class="relative" data-member-dropdown>
                <button type="button" class="flex w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-left text-sm transition-colors hover:border-vspo-purple/40" data-dropdown-trigger aria-expanded="${showCustomMembers}" aria-haspopup="listbox">
                  ${hasChips ? "" : '<span class="text-on-surface-variant/60" data-dropdown-placeholder>Search members...</span>'}
                </button>
                <div class="mb-1.5 flex ${hasChips ? "" : "hidden"} flex-wrap gap-1.5" data-selected-chips>${selectedChips}</div>
                <div class="${showCustomMembers ? "" : "hidden"} absolute left-0 z-10 mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high shadow-lg" data-dropdown-panel>
                  <div class="border-b border-outline-variant/10 p-2">
                    <div class="relative">
                      <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <input type="search" placeholder="Search members..." class="w-full rounded-md border border-outline-variant/20 bg-surface-container-low py-1.5 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/60" data-member-search />
                    </div>
                  </div>
                  <div class="max-h-48 space-y-3 overflow-y-auto p-3 sm:max-h-56">
                    ${args.creators.map(memberRow).join("")}
                  </div>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <a href="/dashboard/${args.guildId}" class="inline-flex items-center justify-center rounded-[--radius-sm] font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">Cancel</a>
              <button type="submit" class="inline-flex items-center justify-center rounded-[--radius-sm] font-medium transition-colors bg-discord text-white hover:bg-discord/90 h-10 px-4 py-2" data-save-btn>Save</button>
            </div>
          </form>
        </div>
      </dialog>
    `;
  },
};

export default meta;
type Story = StoryObj<ChannelConfigFormArgs>;

const creators: Creator[] = [
  {
    id: "c1",
    name: "Creator One",
    memberType: "vspo_jp",
    thumbnailUrl: null,
  },
  {
    id: "c2",
    name: "Creator Two",
    memberType: "vspo_en",
    thumbnailUrl: "https://example.com/c2.png",
  },
];

export const VspoJp: Story = {
  args: {
    channel: {
      channelId: "ch-1",
      channelName: "general",
      enabled: true,
      language: "ja",
      memberType: "vspo_jp",
    },
    creators,
    guildId: "guild-1",
  },
};

export const VspoEn: Story = {
  args: {
    channel: {
      channelId: "ch-2",
      channelName: "en-streams",
      enabled: true,
      language: "en",
      memberType: "vspo_en",
    },
    creators,
    guildId: "guild-1",
  },
};

export const AllMembers: Story = {
  args: {
    channel: {
      channelId: "ch-3",
      channelName: "notifications",
      enabled: true,
      language: "ja",
      memberType: "all",
    },
    creators,
    guildId: "guild-1",
  },
};

export const CustomMembers: Story = {
  args: {
    channel: {
      channelId: "ch-4",
      channelName: "custom-ch",
      enabled: true,
      language: "en",
      memberType: "custom",
      customMembers: ["c1"],
    },
    creators,
    guildId: "guild-1",
  },
};
