import type { Meta, StoryObj } from "@storybook/html";

type AvailableChannel = {
  id: string;
  name: string;
};

type ChannelAddModalArgs = {
  guildId: string;
  availableChannels: AvailableChannel[];
  registeredChannelIds: string[];
};

const hashIcon = `<svg class="h-4 w-4 shrink-0 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>`;

const closeIcon = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;

const meta: Meta<ChannelAddModalArgs> = {
  title: "Channel/ChannelAddModal",
  render: (args) => {
    const registered = new Set(args.registeredChannelIds);
    const unregistered = args.availableChannels.filter(
      (ch) => !registered.has(ch.id),
    );
    const alreadyRegistered = args.availableChannels.filter((ch) =>
      registered.has(ch.id),
    );

    const unregisteredItems = unregistered
      .map(
        (ch) => `
      <div class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-container-highest/30 cursor-pointer" data-channel-item data-channel-name="${ch.name.toLowerCase()}">
        <span class="flex items-center gap-2">${hashIcon}<span>${ch.name}</span></span>
        <span class="text-xs font-medium text-vspo-purple">Add</span>
      </div>`,
      )
      .join("");

    const registeredItems = alreadyRegistered
      .map(
        (ch) => `
      <div class="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-on-surface-variant/50" data-channel-item data-channel-name="${ch.name.toLowerCase()}">
        <span class="flex items-center gap-2">${hashIcon}<span>${ch.name}</span></span>
        <span class="text-xs">Registered</span>
      </div>`,
      )
      .join("");

    const emptyState =
      unregistered.length === 0
        ? `<p class="py-8 text-center text-sm text-on-surface-variant">No available channels found.</p>`
        : "";

    return `
      <dialog open class="fixed inset-0 z-50 flex items-center justify-center" id="add-channel-modal" aria-labelledby="add-channel-heading" aria-modal="true" style="background: rgba(0,0,0,0.6);">
        <div class="glass mx-4 w-full max-w-lg rounded-xl bg-surface-container-high/90 p-6 shadow-hover">
          <div class="mb-4 flex items-center justify-between">
            <h2 id="add-channel-heading" class="font-heading text-lg font-bold text-on-surface">Add Channel</h2>
            <button type="button" class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface" aria-label="Close">${closeIcon}</button>
          </div>
          <div class="mb-4">
            <label for="channel-search" class="sr-only">Search channels...</label>
            <input id="channel-search" type="search" placeholder="Search channels..." class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm placeholder:text-on-surface-variant/60 focus:border-vspo-purple focus:outline-none focus:ring-1 focus:ring-vspo-purple" />
          </div>
          <div class="max-h-64 space-y-1 overflow-y-auto" role="listbox" aria-label="Add Channel">
            ${emptyState}
            ${unregisteredItems}
            ${registeredItems}
          </div>
          <div class="mt-4 flex justify-end">
            <a href="/dashboard/${args.guildId}" class="inline-flex items-center justify-center rounded-[--radius-sm] font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">Cancel</a>
          </div>
        </div>
      </dialog>
    `;
  },
};

export default meta;
type Story = StoryObj<ChannelAddModalArgs>;

export const WithAvailableChannels: Story = {
  args: {
    guildId: "guild-1",
    availableChannels: [
      { id: "ch-1", name: "general" },
      { id: "ch-2", name: "notifications" },
      { id: "ch-3", name: "streams" },
      { id: "ch-4", name: "clips" },
      { id: "ch-5", name: "announcements" },
    ],
    registeredChannelIds: ["ch-1", "ch-3"],
  },
};

export const AllRegistered: Story = {
  args: {
    guildId: "guild-1",
    availableChannels: [
      { id: "ch-1", name: "general" },
      { id: "ch-2", name: "notifications" },
    ],
    registeredChannelIds: ["ch-1", "ch-2"],
  },
};

export const NoChannelsAvailable: Story = {
  args: {
    guildId: "guild-1",
    availableChannels: [],
    registeredChannelIds: [],
  },
};
