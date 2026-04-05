import type { Meta, StoryObj } from "@storybook/html";

const variantClasses: Record<string, string> = {
  default:
    "text-on-surface hover:bg-surface-container-highest focus-visible:ring-vspo-purple/50",
  destructive:
    "text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/50",
};

const settingsIcon = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;

const logoutIcon = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>`;

type MenuItemArgs = {
  variant: string;
  label: string;
  icon: string;
};

const meta: Meta<MenuItemArgs> = {
  title: "UI/MenuItem",
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
  },
  render: (args) => {
    const base =
      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2";
    const classes = `${base} ${variantClasses[args.variant]}`;
    return `<div style="width: 200px;"><button class="${classes}" type="button">${args.icon}<span>${args.label}</span></button></div>`;
  },
};

export default meta;
type Story = StoryObj<MenuItemArgs>;

export const Default: Story = {
  args: {
    variant: "default",
    label: "設定",
    icon: settingsIcon,
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    label: "ログアウト",
    icon: logoutIcon,
  },
};
