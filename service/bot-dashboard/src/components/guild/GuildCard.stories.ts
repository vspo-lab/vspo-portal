import type { Meta, StoryObj } from "@storybook/html";

type GuildCardArgs = {
  guildName: string;
  guildId: string;
  iconHash: string | null;
  botInstalled: boolean;
  channelTotalCount: number;
  channelPreviewNames: string[];
};

const avatarFallback = (name: string, src: string | null) => {
  const sizeClass = "h-10 w-10 text-sm font-bold";
  if (src) {
    return `<img src="${src}" alt="${name}" class="${sizeClass} rounded-full" />`;
  }
  return `<div class="flex ${sizeClass} items-center justify-center rounded-full bg-muted" role="img" aria-label="${name}">${name[0]}</div>`;
};

const iconUrl = (guildId: string, iconHash: string | null): string | null =>
  iconHash
    ? `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.webp?size=128`
    : null;

const meta: Meta<GuildCardArgs> = {
  title: "Guild/GuildCard",
  argTypes: {
    botInstalled: { control: "boolean" },
  },
  render: (args) => {
    const src = iconUrl(args.guildId, args.iconHash);
    const cardClasses = args.botInstalled
      ? "bg-surface-container hover:bg-surface-container-high"
      : "bg-surface-container-low opacity-70";

    const statusBadge = args.botInstalled
      ? `<div class="mt-1.5 flex items-center gap-1.5">
           <div class="relative flex h-2 w-2">
             <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
             <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
           </div>
           <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active</span>
         </div>`
      : `<span class="mt-1 inline-block text-xs text-on-surface-variant">Not installed</span>`;

    const channelSummary =
      args.botInstalled && args.channelTotalCount > 0
        ? `<div class="mb-4">
             <p class="text-xs text-on-surface-variant">${args.channelTotalCount} channels configured</p>
             ${
               args.channelPreviewNames.length > 0
                 ? `<div class="mt-1.5 flex flex-wrap gap-1">
                      ${args.channelPreviewNames.map((n) => `<span class="rounded bg-surface-container-highest px-2 py-0.5 text-xs text-on-surface-variant">#${n}</span>`).join("")}
                    </div>`
                 : ""
             }
           </div>`
        : "";

    const buttonBase =
      "inline-flex items-center justify-center rounded-xl h-9 px-3 text-sm font-medium transition-colors w-full";
    const button = args.botInstalled
      ? `<a href="/dashboard/${args.guildId}" class="${buttonBase} bg-gradient-to-r from-vspo-purple to-vspo-purple-light font-bold text-white shadow-lg shadow-vspo-purple/20 hover:scale-[1.02] active:scale-95">Manage Settings</a>`
      : `<a href="#" class="${buttonBase} border border-border bg-transparent hover:bg-accent hover:text-accent-foreground">Add Bot</a>`;

    return `
      <div style="max-width: 360px;">
        <div class="rounded-2xl p-6 transition-all duration-200 ${cardClasses}">
          <div class="mb-4 flex items-center gap-3">
            ${avatarFallback(args.guildName, src)}
            <div class="min-w-0 flex-1">
              <h3 class="truncate text-base font-semibold leading-none text-on-surface">${args.guildName}</h3>
              ${statusBadge}
            </div>
          </div>
          ${channelSummary}
          <div>${button}</div>
        </div>
      </div>
    `;
  },
};

export default meta;
type Story = StoryObj<GuildCardArgs>;

export const BotInstalled: Story = {
  args: {
    guildName: "My Awesome Server",
    guildId: "guild-123",
    iconHash: "icon_hash",
    botInstalled: true,
    channelTotalCount: 3,
    channelPreviewNames: ["general", "notifications"],
  },
};

export const BotNotInstalled: Story = {
  args: {
    guildName: "Other Server",
    guildId: "guild-456",
    iconHash: null,
    botInstalled: false,
    channelTotalCount: 0,
    channelPreviewNames: [],
  },
};

export const InstalledNoChannels: Story = {
  args: {
    guildName: "New Server",
    guildId: "guild-789",
    iconHash: null,
    botInstalled: true,
    channelTotalCount: 0,
    channelPreviewNames: [],
  },
};

export const ManyChannels: Story = {
  args: {
    guildName: "Busy Server",
    guildId: "guild-101",
    iconHash: "abc123",
    botInstalled: true,
    channelTotalCount: 12,
    channelPreviewNames: [
      "general",
      "notifications",
      "streams",
      "clips",
      "schedule",
    ],
  },
};
