import type { Meta, StoryObj } from "@storybook/html";

const warningIcon = `<svg class="h-5 w-5 shrink-0 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>`;

type ErrorAlertArgs = {
  message: string;
  retryHref: string;
  retryLabel: string;
};

const meta: Meta<ErrorAlertArgs> = {
  title: "UI/ErrorAlert",
  argTypes: {
    message: { control: "text" },
    retryHref: { control: "text" },
    retryLabel: { control: "text" },
  },
  render: (args) => {
    return `<div role="alert" class="flex items-center gap-3 rounded-xl bg-destructive/10 p-4 text-sm text-on-surface">${warningIcon}<span class="flex-1">${args.message}</span><a href="${args.retryHref}" class="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vspo-purple/50">${args.retryLabel}</a></div>`;
  },
};

export default meta;
type Story = StoryObj<ErrorAlertArgs>;

export const Default: Story = {
  args: {
    message: "データの読み込みに失敗しました",
    retryHref: "/dashboard",
    retryLabel: "再試行",
  },
};
