import type { Meta, StoryObj } from "@storybook/html";

type Channel = {
  channelId: string;
  channelName: string;
  enabled: boolean;
  language: string;
  memberType: string;
  customMembers?: string[];
};

type ChannelTableArgs = {
  channels: Channel[];
};

const hashIcon = `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>`;

const editIcon = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`;

const deleteIcon = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;

const addIcon = `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>`;

const langChipLabel = (lang: string) =>
  lang === "ja" ? "JA" : lang === "en" ? "EN" : lang.toUpperCase();

const memberTypeLabel: Record<string, string> = {
  vspo_jp: "VSPO! JP",
  vspo_en: "VSPO! EN",
  all: "All Members",
  custom: "Custom",
};

const renderStatus = (enabled: boolean) =>
  enabled
    ? `<div class="flex items-center gap-2">
        <div class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
          <span class="relative inline-flex h-2 w-2 rounded-full bg-success shadow-sm shadow-success/50"></span>
        </div>
        <span class="text-[10px] font-bold uppercase tracking-wider text-success">Active</span>
      </div>`
    : `<div class="flex items-center gap-2">
        <span class="inline-flex h-2 w-2 rounded-full bg-on-surface-variant/40"></span>
        <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">Paused</span>
      </div>`;

const renderRow = (ch: Channel, i: number) => `
  <tr class="group transition-colors duration-200 ${i % 2 === 0 ? "bg-surface" : "bg-surface-container-lowest"} hover:bg-surface-container-highest/30">
    <td class="px-6 py-4 sm:px-8">
      <div class="flex items-center gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-vspo-purple/10 text-vspo-purple">${hashIcon}</div>
        <div>
          <p class="text-sm font-semibold text-on-surface">${ch.channelName}</p>
          <p class="text-[10px] text-on-surface-variant/60">${ch.channelId}</p>
        </div>
      </div>
    </td>
    <td class="px-6 py-4 sm:px-8">
      <span class="rounded bg-surface-container-highest px-2.5 py-1 text-[10px] font-bold text-on-surface">${langChipLabel(ch.language)}</span>
    </td>
    <td class="px-6 py-4 text-xs font-medium text-on-surface-variant sm:px-8">${memberTypeLabel[ch.memberType] ?? ch.memberType}</td>
    <td class="px-6 py-4 sm:px-8">${renderStatus(ch.enabled)}</td>
    <td class="px-6 py-4 sm:px-8">
      <div class="flex items-center justify-end gap-2">
        <a href="?edit=${ch.channelId}" class="rounded-lg p-2 text-on-surface-variant transition-colors hover:text-vspo-purple" aria-label="Edit #${ch.channelName}">${editIcon}</a>
        <a href="?delete=${ch.channelId}" class="rounded-lg p-2 text-on-surface-variant transition-colors hover:text-destructive" aria-label="Delete #${ch.channelName}">${deleteIcon}</a>
      </div>
    </td>
  </tr>`;

const meta: Meta<ChannelTableArgs> = {
  title: "Channel/ChannelTable",
  render: (args) => {
    const rows = args.channels.map(renderRow).join("");

    const emptyState =
      args.channels.length === 0
        ? `<div class="flex flex-col items-center gap-3 p-12 text-center">
            <svg class="h-12 w-12 text-on-surface-variant/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <p class="text-sm text-on-surface-variant">No channels configured.</p>
            <a href="?add=true" class="mt-2 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-vspo-purple transition-colors hover:bg-vspo-purple/10">
              ${addIcon} Add Channel
            </a>
          </div>`
        : "";

    return `
      <div class="overflow-hidden rounded-2xl bg-surface-container-low">
        <div class="flex items-center justify-between bg-surface-container-low px-6 py-5 sm:px-8">
          <h3 class="font-heading text-lg font-bold text-on-surface">Channel settings</h3>
          <a href="?add=true" class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-vspo-purple to-vspo-purple-light px-5 py-2.5 font-heading text-sm font-bold text-white shadow-lg shadow-vspo-purple/20 transition-all hover:scale-[1.03] active:scale-95">
            ${addIcon} Add Channel
          </a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left" aria-label="Channel settings">
            <thead>
              <tr class="bg-surface-container-high text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                <th scope="col" class="px-6 py-4 sm:px-8">Channel</th>
                <th scope="col" class="px-6 py-4 sm:px-8">Language</th>
                <th scope="col" class="px-6 py-4 sm:px-8">Members</th>
                <th scope="col" class="px-6 py-4 sm:px-8">Status</th>
                <th scope="col" class="px-6 py-4 text-right sm:px-8">Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${emptyState}
      </div>
    `;
  },
};

export default meta;
type Story = StoryObj<ChannelTableArgs>;

export const WithChannels: Story = {
  args: {
    channels: [
      {
        channelId: "ch-1",
        channelName: "general",
        enabled: true,
        language: "ja",
        memberType: "all",
      },
      {
        channelId: "ch-2",
        channelName: "notifications",
        enabled: false,
        language: "en",
        memberType: "vspo_jp",
      },
    ],
  },
};

export const ManyChannels: Story = {
  args: {
    channels: [
      {
        channelId: "ch-1",
        channelName: "general",
        enabled: true,
        language: "ja",
        memberType: "all",
      },
      {
        channelId: "ch-2",
        channelName: "notifications",
        enabled: false,
        language: "en",
        memberType: "vspo_jp",
      },
      {
        channelId: "ch-3",
        channelName: "streams",
        enabled: true,
        language: "ja",
        memberType: "vspo_en",
      },
      {
        channelId: "ch-4",
        channelName: "clips",
        enabled: true,
        language: "en",
        memberType: "custom",
        customMembers: ["c1", "c2"],
      },
      {
        channelId: "ch-5",
        channelName: "announcements",
        enabled: false,
        language: "ja",
        memberType: "all",
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    channels: [],
  },
};
