import type { Meta, StoryObj } from "@storybook/html";

const successIcon = `<svg class="h-5 w-5 shrink-0 text-vspo-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

const errorIcon = `<svg class="h-5 w-5 shrink-0 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>`;

type FlashMessageArgs = {
  type: "success" | "error";
  message: string;
};

const meta: Meta<FlashMessageArgs> = {
  title: "UI/FlashMessage",
  argTypes: {
    type: {
      control: "select",
      options: ["success", "error"],
    },
    message: { control: "text" },
  },
  render: (args) => {
    const bgClass =
      args.type === "success" ? "bg-vspo-purple/10" : "bg-destructive/10";
    const icon = args.type === "success" ? successIcon : errorIcon;
    return `<div role="status" aria-live="polite" class="flex items-center gap-3 rounded-xl p-4 text-sm text-on-surface ${bgClass}">${icon}<span class="flex-1">${args.message}</span></div>`;
  },
};

export default meta;
type Story = StoryObj<FlashMessageArgs>;

export const Success: Story = {
  args: {
    type: "success",
    message: "設定を保存しました",
  },
};

export const Error: Story = {
  args: {
    type: "error",
    message: "エラーが発生しました。もう一度お試しください。",
  },
};
