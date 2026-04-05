import type { Meta, StoryObj } from "@storybook/html";

type CardArgs = {
  title: string;
  description: string;
};

const meta: Meta<CardArgs> = {
  title: "UI/Card",
  render: (args) => {
    return `
      <div class="rounded-[--radius] border border-border bg-card text-card-foreground shadow-card" style="max-width: 320px;">
        <div class="flex flex-col space-y-1.5 p-6 pb-2">
          <h2 class="text-base font-semibold leading-none tracking-tight">${args.title}</h2>
        </div>
        <div class="p-6 pt-0">
          <p class="text-sm text-muted-foreground">${args.description}</p>
        </div>
      </div>
    `;
  },
};

export default meta;
type Story = StoryObj<CardArgs>;

export const Default: Story = {
  args: {
    title: "一覧管理",
    description: "サーバーとチャンネルの設定を一目で確認",
  },
};

export const Feature: Story = {
  args: {
    title: "メンバーフィルター",
    description: "JP・EN・カスタム設定で通知対象を細かく絞り込み",
  },
};
