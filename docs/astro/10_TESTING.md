# テスト戦略

## 現状

- vitest の設定あり
- テストファイルの数が少ない (要確認)
- vanilla JS コンポーネントはテスト困難

## テスト種別

### 1. React コンポーネント単体テスト

React island 化により、コンポーネントの単体テストが容易になる。

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

```typescript
// src/test/setup.ts
import "@testing-library/jest-dom";
```

#### テスト例: ChannelConfigModal

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChannelConfigModal } from "./ChannelConfigModal";

const mockChannel = {
  channelId: "123456789",
  channelName: "general",
  language: "ja",
  memberType: "all",
  customMemberIds: [],
};

const mockMembers = [
  { id: "1", name: "Member A", group: "vspo" },
  { id: "2", name: "Member B", group: "vspo" },
];

describe("ChannelConfigModal", () => {
  test("renders channel name in dialog title", () => {
    render(
      <ChannelConfigModal
        channel={mockChannel}
        members={mockMembers}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText("#general")).toBeInTheDocument();
  });

  test("shows custom member picker when custom type selected", async () => {
    const user = userEvent.setup();
    render(
      <ChannelConfigModal
        channel={mockChannel}
        members={mockMembers}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Custom"));
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  test("filters members by search query", async () => {
    const user = userEvent.setup();
    render(
      <ChannelConfigModal
        channel={{ ...mockChannel, memberType: "custom" }}
        members={mockMembers}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    await user.type(screen.getByRole("combobox"), "Member A");
    expect(screen.getByText("Member A")).toBeInTheDocument();
    expect(screen.queryByText("Member B")).not.toBeInTheDocument();
  });

  test("calls onSave with updated config", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <ChannelConfigModal
        channel={mockChannel}
        members={mockMembers}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    // Change language
    await user.selectOptions(screen.getByLabelText("Language"), "en");

    // Save
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ language: "en" })
    );
  });

  test("disables save button when no changes", () => {
    render(
      <ChannelConfigModal
        channel={mockChannel}
        members={mockMembers}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });
});
```

#### テスト例: DeleteChannelDialog

```tsx
describe("DeleteChannelDialog", () => {
  test("shows channel name in confirmation", () => {
    render(
      <DeleteChannelDialog
        channelName="general"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/general/)).toBeInTheDocument();
  });

  test("calls onConfirm when delete button clicked", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteChannelDialog
        channelName="general"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  test("focuses cancel button on mount", () => {
    render(
      <DeleteChannelDialog
        channelName="general"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus();
  });
});
```

### 2. Nano Store テスト

```tsx
import { $channelData, optimisticUpdate, optimisticRemove } from "../stores/channel-data";

describe("channel-data store", () => {
  beforeEach(() => {
    $channelData.set({ channels: [], isLoading: false, error: null });
  });

  test("optimisticUpdate updates a channel", () => {
    $channelData.setKey("channels", [
      { id: "1", name: "general", language: "ja", memberType: "all" },
    ]);

    optimisticUpdate("1", { language: "en" });

    expect($channelData.get().channels[0].language).toBe("en");
  });

  test("optimisticRemove removes a channel", () => {
    $channelData.setKey("channels", [
      { id: "1", name: "general", language: "ja", memberType: "all" },
      { id: "2", name: "random", language: "ja", memberType: "all" },
    ]);

    optimisticRemove("1");

    expect($channelData.get().channels).toHaveLength(1);
    expect($channelData.get().channels[0].id).toBe("2");
  });
});
```

### 3. Hook テスト

```tsx
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../hooks/useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("returns current theme", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  test("toggles theme", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.theme).toBe("dark");
  });
});
```

### 4. Astro Actions テスト

```typescript
// src/actions/__tests__/index.test.ts
import { describe, test, expect, vi } from "vitest";

// Astro Actions のユニットテストは handler 関数を直接テスト
describe("updateChannel action handler", () => {
  test("validates input with Zod schema", async () => {
    const input = {
      guildId: "invalid", // Discord snowflake ではない
      channelId: "123456789012345678",
      language: "ja",
      memberType: "all",
    };

    // Zod バリデーションエラーを検証
    // (Astro Action の handler を直接呼べるか、または schema だけテスト)
  });
});
```

### 5. ドメインロジックテスト

```typescript
// features/channel/domain/__tests__/member-type.test.ts
import { MemberType, isMemberTypeValue } from "../member-type";

describe("MemberType", () => {
  test("validates member type values", () => {
    expect(isMemberTypeValue("all")).toBe(true);
    expect(isMemberTypeValue("custom")).toBe(true);
    expect(isMemberTypeValue("none")).toBe(true);
    expect(isMemberTypeValue("invalid")).toBe(false);
  });
});
```

### 6. アクセシビリティテスト

```tsx
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("a11y", () => {
  test("ChannelConfigModal", async () => {
    const { container } = render(<ChannelConfigModal {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  test("ChannelAddModal", async () => {
    const { container } = render(<ChannelAddModal {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  test("DeleteChannelDialog", async () => {
    const { container } = render(<DeleteChannelDialog {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  test("ThemeToggle", async () => {
    const { container } = render(<ThemeToggle />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

### 7. E2E テスト (Playwright)

```bash
pnpm add -D @playwright/test
```

```typescript
// e2e/channel-config.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Channel Configuration", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Discord OAuth
    await page.route("**/api/auth/**", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ user: { id: "1", username: "test" } }),
      });
    });
    await page.goto("/dashboard/123456789");
  });

  test("edit channel config", async ({ page }) => {
    // Click edit button
    await page.click('[aria-label="Edit general channel settings"]');

    // Verify dialog opened
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Change language
    await page.selectOption('[name="language"]', "en");

    // Save
    await page.click('button:has-text("Save")');

    // Verify success message
    await expect(page.getByRole("status")).toContainText("updated");
  });

  test("delete channel", async ({ page }) => {
    await page.click('[aria-label="Delete general channel"]');

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.click('button:has-text("Delete")');

    // Verify channel removed from table
    await expect(page.getByText("general")).not.toBeVisible();
  });

  test("add channel", async ({ page }) => {
    await page.click('button:has-text("Add Channel")');

    // Wait for channel list to load
    await expect(page.getByRole("listbox")).toBeVisible();

    // Search and select
    await page.fill('[aria-label="Search channels"]', "announcements");
    await page.click('text=announcements');

    // Verify added
    await expect(page.getByText("announcements")).toBeVisible();
  });
});
```

## テストカバレッジ目標

| レイヤー | カバレッジ目標 | テスト種別 |
|---------|-------------|-----------|
| Domain (types, schemas) | 90%+ | Unit |
| Stores (Nano Stores) | 90%+ | Unit |
| Hooks (useDialog, etc.) | 80%+ | Unit |
| React Components | 80%+ | Unit + Integration |
| Astro Actions | 80%+ | Unit |
| API Endpoints | 80%+ | Integration |
| Critical User Flows | 100% | E2E |

## テストファイル配置

```text
src/
  features/
    channel/
      components/
        __tests__/
          ChannelConfigModal.test.tsx
          ChannelAddModal.test.tsx
          DeleteChannelDialog.test.tsx
      stores/
        __tests__/
          channel-data.test.ts
          channel-actions.test.ts
      domain/
        __tests__/
          member-type.test.ts
          channel-config.test.ts
    shared/
      hooks/
        __tests__/
          useDialog.test.ts
          useClickOutside.test.ts
          useTheme.test.ts
      stores/
        __tests__/
          theme.test.ts
          flash.test.ts
  actions/
    __tests__/
      index.test.ts
e2e/
  channel-config.spec.ts
  auth.spec.ts
  landing.spec.ts
```
