import type { Meta, StoryObj } from "@storybook/html";

type AvatarArgs = {
  name: string;
  src: string | null;
  size: "xs" | "sm" | "md" | "lg";
};

const sizeClasses = {
  xs: { img: "h-5 w-5", text: "text-xs" },
  sm: { img: "h-8 w-8", text: "text-sm font-medium" },
  md: { img: "h-10 w-10", text: "text-sm font-bold" },
  lg: { img: "h-12 w-12", text: "text-lg font-bold" },
};

const meta: Meta<AvatarArgs> = {
  title: "UI/AvatarFallback",
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg"] },
  },
  render: (args) => {
    const classes = sizeClasses[args.size];
    if (args.src) {
      return `<img src="${args.src}" alt="${args.name}" class="${classes.img} rounded-full" />`;
    }
    return `<div class="flex ${classes.img} items-center justify-center rounded-full bg-muted ${classes.text}" role="img" aria-label="${args.name}">${args.name[0]}</div>`;
  },
};

export default meta;
type Story = StoryObj<AvatarArgs>;

export const WithImage: Story = {
  args: { name: "Server", src: "https://placehold.co/40", size: "md" },
};

export const Fallback: Story = {
  args: { name: "My Server", src: null, size: "md" },
};

export const ExtraSmall: Story = {
  args: { name: "S", src: null, size: "xs" },
};

export const Large: Story = {
  args: { name: "Large Avatar", src: null, size: "lg" },
};
