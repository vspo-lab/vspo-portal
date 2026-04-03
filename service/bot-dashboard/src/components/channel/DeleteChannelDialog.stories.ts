import type { Meta, StoryObj } from "@storybook/html";

type Channel = {
  channelId: string;
  channelName: string;
  enabled: boolean;
  language: string;
  memberType: string;
};

type DeleteChannelDialogArgs = {
  channel: Channel;
  guildId: string;
};

const warningIcon = `<svg class="h-5 w-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>`;

const meta: Meta<DeleteChannelDialogArgs> = {
  title: "Channel/DeleteChannelDialog",
  render: (args) => {
    return `
      <dialog open class="fixed inset-0 z-50 flex items-center justify-center" id="delete-channel-modal" aria-labelledby="delete-channel-heading" aria-modal="true" style="background: rgba(0,0,0,0.6);">
        <div class="glass mx-4 w-full max-w-md rounded-xl bg-surface-container-high/90 p-6 shadow-hover">
          <div class="mb-4 flex items-start gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10" aria-hidden="true">${warningIcon}</span>
            <div class="min-w-0 flex-1">
              <h2 id="delete-channel-heading" class="text-base font-semibold leading-snug">Delete #${args.channel.channelName}?</h2>
              <p class="mt-1 text-sm text-on-surface-variant">This action cannot be undone. All notification settings for this channel will be permanently removed.</p>
            </div>
          </div>
          <form class="flex justify-end gap-2 pt-2">
            <input type="hidden" name="guildId" value="${args.guildId}" />
            <input type="hidden" name="channelId" value="${args.channel.channelId}" />
            <a href="/dashboard/${args.guildId}" class="inline-flex items-center justify-center rounded-[--radius-sm] font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm">Cancel</a>
            <button type="submit" class="inline-flex items-center justify-center rounded-[--radius-sm] font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3 text-sm">Delete</button>
          </form>
        </div>
      </dialog>
    `;
  },
};

export default meta;
type Story = StoryObj<DeleteChannelDialogArgs>;

export const Default: Story = {
  args: {
    channel: {
      channelId: "ch-1",
      channelName: "general",
      enabled: true,
      language: "ja",
      memberType: "all",
    },
    guildId: "guild-1",
  },
};

export const DisabledChannel: Story = {
  args: {
    channel: {
      channelId: "ch-2",
      channelName: "notifications",
      enabled: false,
      language: "en",
      memberType: "vspo_jp",
    },
    guildId: "guild-1",
  },
};
