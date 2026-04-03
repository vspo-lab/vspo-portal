import type { Meta, StoryObj } from "@storybook/html";

const variantClasses: Record<string, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  discord: "bg-discord text-white hover:bg-discord/90",
  gradient:
    "bg-gradient-to-r from-vspo-purple to-[#bec2ff] text-white font-bold shadow-lg shadow-vspo-purple/20 hover:scale-[1.02] active:scale-95",
};

const sizeClasses: Record<string, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-8 text-lg",
  icon: "h-10 w-10",
};

type ButtonArgs = {
  label: string;
  variant: string;
  size: string;
  disabled: boolean;
};

const meta: Meta<ButtonArgs> = {
  title: "UI/Button",
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "outline",
        "ghost",
        "destructive",
        "discord",
        "gradient",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: { control: "boolean" },
  },
  render: (args) => {
    const base =
      "inline-flex items-center justify-center rounded-[--radius-sm] font-medium transition-colors duration-[--duration-fast] ease-[--ease-standard] focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50";
    const classes = `${base} ${variantClasses[args.variant]} ${sizeClasses[args.size]}`;
    return `<button class="${classes}" ${args.disabled ? "disabled" : ""}>${args.label}</button>`;
  },
};

export default meta;
type Story = StoryObj<ButtonArgs>;

export const Default: Story = {
  args: {
    label: "ボタン",
    variant: "default",
    size: "default",
    disabled: false,
  },
};

export const Secondary: Story = {
  args: {
    label: "セカンダリ",
    variant: "secondary",
    size: "default",
    disabled: false,
  },
};

export const Outline: Story = {
  args: {
    label: "アウトライン",
    variant: "outline",
    size: "default",
    disabled: false,
  },
};

export const Ghost: Story = {
  args: {
    label: "ゴースト",
    variant: "ghost",
    size: "default",
    disabled: false,
  },
};

export const Destructive: Story = {
  args: {
    label: "削除",
    variant: "destructive",
    size: "default",
    disabled: false,
  },
};

export const Discord: Story = {
  args: {
    label: "Discord でログイン",
    variant: "discord",
    size: "lg",
    disabled: false,
  },
};

export const Small: Story = {
  args: { label: "小", variant: "default", size: "sm", disabled: false },
};

export const Large: Story = {
  args: {
    label: "大きいボタン",
    variant: "default",
    size: "lg",
    disabled: false,
  },
};

export const Gradient: Story = {
  args: {
    label: "グラデーション",
    variant: "gradient",
    size: "default",
    disabled: false,
  },
};

export const Disabled: Story = {
  args: { label: "無効", variant: "default", size: "default", disabled: true },
};
