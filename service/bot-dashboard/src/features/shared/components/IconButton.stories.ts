import type { Meta, StoryObj } from "@storybook/html";

const variantClasses: Record<string, string> = {
  ghost:
    "hover:bg-surface-container-highest hover:text-vspo-purple focus-visible:ring-vspo-purple/50",
  destructive:
    "hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/50",
};

const sizeClasses: Record<string, string> = {
  default: "h-10 w-10",
  sm: "h-8 w-8",
};

const editIcon = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`;

const trashIcon = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;

type IconButtonArgs = {
  variant: string;
  size: string;
  icon: string;
};

const meta: Meta<IconButtonArgs> = {
  title: "UI/IconButton",
  argTypes: {
    variant: {
      control: "select",
      options: ["ghost", "destructive"],
    },
    size: {
      control: "select",
      options: ["default", "sm"],
    },
  },
  render: (args) => {
    const base =
      "inline-flex items-center justify-center rounded-lg text-on-surface-variant transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2";
    const classes = `${base} ${variantClasses[args.variant]} ${sizeClasses[args.size]}`;
    return `<button class="${classes}" type="button">${args.icon}</button>`;
  },
};

export default meta;
type Story = StoryObj<IconButtonArgs>;

export const Default: Story = {
  args: {
    variant: "ghost",
    size: "default",
    icon: editIcon,
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    size: "default",
    icon: trashIcon,
  },
};

export const Small: Story = {
  args: {
    variant: "ghost",
    size: "sm",
    icon: editIcon,
  },
};
