/**
 * Client-side controller for channel CRUD operations.
 * Manages modal open/close, form submissions via Astro Actions, and DOM updates.
 * Replaces MPA query-param navigation with SPA-like interactions.
 *
 * @precondition Page must contain #channel-data script with JSON payload
 * @postcondition All modal interactions happen client-side without page reload
 */
import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";

/* ---------- Types ---------- */

type ChannelConfig = {
  channelId: string;
  channelName: string;
  enabled: boolean;
  language: string;
  memberType: string;
  customMembers?: string[];
};

type Creator = {
  id: string;
  name: string;
  memberType: "vspo_jp" | "vspo_en";
  thumbnailUrl: string | null;
};

type PageData = {
  guildId: string;
  channels: ChannelConfig[];
  creators: Creator[];
  i18n: Record<string, string>;
};

/* ---------- State ---------- */

const getPageData = (): PageData => {
  const el = document.getElementById("channel-data");
  if (!el?.textContent) throw new Error("Missing #channel-data");
  return JSON.parse(el.textContent);
};

/* ---------- Toast ---------- */

const showToast = (message: string, type: "success" | "error" = "success") => {
  const existing = document.querySelector("[data-toast]");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.setAttribute("data-toast", "");
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.className = `toast-${type} flex items-center gap-3 rounded-xl p-4 text-sm text-on-surface ${
    type === "success" ? "bg-vspo-purple/10" : "bg-destructive/10"
  }`;

  const icon =
    type === "success"
      ? `<svg class="h-5 w-5 shrink-0 text-vspo-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
      : `<svg class="h-5 w-5 shrink-0 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>`;

  toast.innerHTML = `${icon}<span class="flex-1">${message}</span><button type="button" class="shrink-0 rounded-lg p-2 text-on-surface-variant hover:text-on-surface cursor-pointer" aria-label="close"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>`;

  toast
    .querySelector("button")
    ?.addEventListener("click", () => toast.remove());

  const alertsContainer = document.querySelector("[data-alerts]");
  if (alertsContainer) {
    alertsContainer.appendChild(toast);
  }

  setTimeout(() => toast.remove(), 5000);
};

/* ---------- Modal helpers ---------- */

const openDialog = (dialog: HTMLDialogElement) => {
  dialog.showModal();
};

const closeDialog = (dialog: HTMLDialogElement) => {
  dialog.close();
};

/* ---------- Delete ---------- */

const initDelete = () => {
  const dialog = document.getElementById(
    "delete-channel-modal",
  ) as HTMLDialogElement | null;
  if (!dialog) return;

  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-action-delete]",
    );
    if (!btn || !dialog) return;

    const data = getPageData();
    const channelId = btn.dataset.actionDelete;
    if (!channelId) return;
    const channel = data.channels.find((c) => c.channelId === channelId);
    if (!channel) return;

    // Populate dialog
    const heading = dialog.querySelector("[data-delete-heading]");
    if (heading)
      heading.textContent =
        data.i18n["channel.deleteConfirm"]?.replace(
          "{channelName}",
          channel.channelName,
        ) ?? `Delete #${channel.channelName}?`;

    const hiddenChannelId = dialog.querySelector<HTMLInputElement>(
      'input[name="channelId"]',
    );
    if (hiddenChannelId) hiddenChannelId.value = channelId;

    openDialog(dialog);
  });

  // Close handlers
  dialog.querySelector("[data-modal-cancel]")?.addEventListener("click", () => {
    closeDialog(dialog);
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeDialog(dialog);
  });

  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDialog(dialog);
  });

  // Submit handler
  dialog
    .querySelector("[data-modal-confirm]")
    ?.addEventListener("click", async () => {
      const data = getPageData();
      const channelId = dialog.querySelector<HTMLInputElement>(
        'input[name="channelId"]',
      )?.value;
      if (!channelId) return;

      const confirmBtn = dialog.querySelector<HTMLButtonElement>(
        "[data-modal-confirm]",
      );
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.classList.add("opacity-50");
      }

      const { error } = await actions.deleteChannel({
        guildId: data.guildId,
        channelId,
      });

      if (error) {
        closeDialog(dialog);
        showToast(error.message, "error");
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.classList.remove("opacity-50");
        }
        return;
      }

      closeDialog(dialog);
      showToast(data.i18n["toast.deleteSuccess"] ?? "Deleted.");
      // Reload page data via View Transitions (soft navigation)
      navigate(window.location.pathname, { history: "replace" });
    });
};

/* ---------- Add ---------- */

const initAdd = () => {
  const dialog = document.getElementById(
    "add-channel-modal",
  ) as HTMLDialogElement | null;
  if (!dialog) return;

  const listContainer = dialog.querySelector<HTMLElement>(
    "[data-channel-list]",
  );
  const searchInput = dialog.querySelector<HTMLInputElement>(
    "[data-search-input]",
  );
  const emptyMsg = dialog.querySelector<HTMLElement>("[data-search-empty]");
  const loadingEl = dialog.querySelector<HTMLElement>("[data-loading]");
  const noChannelsEl = dialog.querySelector<HTMLElement>("[data-no-channels]");

  // Open handler
  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-action-add]",
    );
    if (!btn || !dialog) return;

    openDialog(dialog);
    loadChannels();
  });

  // Close handlers
  dialog.querySelector("[data-modal-close]")?.addEventListener("click", () => {
    closeDialog(dialog);
  });
  dialog.querySelector("[data-modal-cancel]")?.addEventListener("click", () => {
    closeDialog(dialog);
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeDialog(dialog);
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDialog(dialog);
  });

  // Search filter
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  searchInput?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const query = searchInput.value.toLowerCase();
      const items =
        listContainer?.querySelectorAll("[data-channel-item]") ?? [];
      let visibleCount = 0;
      for (const item of items) {
        const el = item as HTMLElement;
        const name = el.dataset.channelName ?? "";
        const show = name.includes(query);
        el.style.display = show ? "" : "none";
        if (show) visibleCount++;
      }
      if (emptyMsg) {
        emptyMsg.classList.toggle("hidden", visibleCount > 0 || !query);
      }
    }, 100);
  });

  const loadChannels = async () => {
    if (!listContainer) return;

    // Show loading
    if (loadingEl) loadingEl.classList.remove("hidden");
    if (noChannelsEl) noChannelsEl.classList.add("hidden");
    listContainer.innerHTML = "";

    const data = getPageData();
    const registeredIds = new Set(data.channels.map((c) => c.channelId));

    const res = await fetch(`/api/guilds/${data.guildId}/channels`);
    if (loadingEl) loadingEl.classList.add("hidden");

    if (!res.ok) {
      showToast(
        data.i18n["dashboard.error"]?.replace(
          "{message}",
          "Failed to load channels",
        ) ?? "Failed to load channels",
        "error",
      );
      return;
    }

    const allChannels: { id: string; name: string }[] = await res.json();
    const unregistered = allChannels.filter((ch) => !registeredIds.has(ch.id));

    if (unregistered.length === 0 && allChannels.length === 0) {
      if (noChannelsEl) noChannelsEl.classList.remove("hidden");
      return;
    }

    // Render unregistered channels
    for (const ch of unregistered) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-channel-item", "");
      btn.setAttribute("data-channel-name", ch.name.toLowerCase());
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", "false");
      btn.className =
        "flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition-colors duration-[--duration-fast] hover:bg-surface-container-highest/30 cursor-pointer";
      btn.innerHTML = `<span class="flex items-center gap-2"><svg class="h-4 w-4 shrink-0 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg><span>${ch.name}</span></span><span class="text-xs font-medium text-vspo-purple">${data.i18n["channel.add.submit"] ?? "Add"}</span>`;

      btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.classList.add("opacity-50");

        const { error } = await actions.addChannel({
          guildId: data.guildId,
          channelId: ch.id,
        });

        if (error) {
          btn.disabled = false;
          btn.classList.remove("opacity-50");
          showToast(error.message, "error");
          return;
        }

        closeDialog(dialog);
        showToast(data.i18n["toast.addSuccess"] ?? "Channel added.");
        navigate(window.location.pathname, { history: "replace" });
      });

      listContainer.appendChild(btn);
    }

    // Render registered channels (disabled)
    for (const ch of allChannels.filter((c) => registeredIds.has(c.id))) {
      const div = document.createElement("div");
      div.setAttribute("data-channel-item", "");
      div.setAttribute("data-channel-name", ch.name.toLowerCase());
      div.className =
        "flex items-center justify-between rounded-lg px-3 py-3 text-sm text-on-surface-variant/50";
      div.innerHTML = `<span class="flex items-center gap-2"><svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg><span>${ch.name}</span></span><span class="text-xs">${data.i18n["channel.add.registered"] ?? "Registered"}</span>`;
      listContainer.appendChild(div);
    }
  };
};

/* ---------- Edit / Config ---------- */

const initEdit = () => {
  const dialog = document.getElementById(
    "config-modal",
  ) as HTMLDialogElement | null;
  if (!dialog) return;

  const form = dialog.querySelector<HTMLFormElement>("#update-channel-form");
  const hiddenChannelId = form?.querySelector<HTMLInputElement>(
    'input[name="channelId"]',
  );

  // Open handler
  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-action-edit]",
    );
    if (!btn || !dialog) return;

    const data = getPageData();
    const channelId = btn.dataset.actionEdit;
    if (!channelId) return;
    const channel = data.channels.find((c) => c.channelId === channelId);
    if (!channel) return;

    populateEditForm(dialog, channel, data);
    openDialog(dialog);
  });

  // Close handlers
  dialog.querySelector("[data-modal-close]")?.addEventListener("click", () => {
    closeDialog(dialog);
  });
  dialog.querySelector("[data-modal-cancel]")?.addEventListener("click", () => {
    closeDialog(dialog);
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeDialog(dialog);
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDialog(dialog);
  });

  // Save handler
  dialog
    .querySelector("[data-save-btn]")
    ?.addEventListener("click", async () => {
      if (!form || !hiddenChannelId) return;

      const data = getPageData();
      const formData = new FormData(form);
      const channelId = hiddenChannelId.value;
      const language = formData.get("language") as string;
      const memberType = formData.get("memberType") as
        | "vspo_jp"
        | "vspo_en"
        | "all"
        | "custom";
      const customMemberIds = formData.getAll("customMemberIds") as string[];

      const saveBtn =
        dialog.querySelector<HTMLButtonElement>("[data-save-btn]");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.classList.add("opacity-50");
      }

      const { error } = await actions.updateChannel({
        guildId: data.guildId,
        channelId,
        language,
        memberType,
        customMemberIds: memberType === "custom" ? customMemberIds : undefined,
      });

      if (error) {
        showToast(error.message, "error");
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.classList.remove("opacity-50");
        }
        return;
      }

      closeDialog(dialog);
      showToast(data.i18n["toast.updateSuccess"] ?? "Updated.");
      navigate(window.location.pathname, { history: "replace" });
    });

  // Reset handler
  dialog
    .querySelector("[data-reset-btn]")
    ?.addEventListener("click", async () => {
      if (!hiddenChannelId) return;

      const data = getPageData();
      const channelId = hiddenChannelId.value;

      const resetBtn =
        dialog.querySelector<HTMLButtonElement>("[data-reset-btn]");
      if (resetBtn) {
        resetBtn.disabled = true;
        resetBtn.classList.add("opacity-50");
      }

      const { error } = await actions.resetChannel({
        guildId: data.guildId,
        channelId,
      });

      if (error) {
        showToast(error.message, "error");
        if (resetBtn) {
          resetBtn.disabled = false;
          resetBtn.classList.remove("opacity-50");
        }
        return;
      }

      closeDialog(dialog);
      showToast(data.i18n["toast.resetSuccess"] ?? "Reset to default.");
      navigate(window.location.pathname, { history: "replace" });
    });
};

const populateEditForm = (
  dialog: HTMLElement,
  channel: ChannelConfig,
  data: PageData,
) => {
  // Title
  const heading = dialog.querySelector("[data-config-heading]");
  if (heading) {
    heading.textContent =
      data.i18n["channelConfig.title"]?.replace(
        "{channelName}",
        channel.channelName,
      ) ?? `#${channel.channelName}`;
  }

  // Hidden channel ID
  const hiddenId = dialog.querySelector<HTMLInputElement>(
    'input[name="channelId"]',
  );
  if (hiddenId) hiddenId.value = channel.channelId;

  // Language select
  const langSelect = dialog.querySelector<HTMLSelectElement>("#language");
  if (langSelect) langSelect.value = channel.language;

  // Member type radios
  const radios = dialog.querySelectorAll<HTMLInputElement>(
    'input[name="memberType"]',
  );
  for (const radio of radios) {
    radio.checked = radio.value === channel.memberType;
    const label = radio.closest<HTMLElement>("[data-radio-label]");
    if (label) {
      if (radio.checked) {
        label.classList.add(
          "bg-vspo-purple/10",
          "ring-1",
          "ring-vspo-purple/30",
        );
        label.classList.remove("hover:bg-surface-container-highest/50");
      } else {
        label.classList.remove(
          "bg-vspo-purple/10",
          "ring-1",
          "ring-vspo-purple/30",
        );
        label.classList.add("hover:bg-surface-container-highest/50");
      }
    }
  }

  // Custom members section visibility
  const customSection = dialog.querySelector<HTMLElement>(
    "[data-custom-members]",
  );
  const showCustom = channel.memberType === "custom";
  if (customSection) {
    customSection.setAttribute("aria-hidden", String(!showCustom));
    if (showCustom) {
      customSection.classList.remove("max-h-0", "opacity-0");
      customSection.classList.add("max-h-[600px]", "opacity-100");
    } else {
      customSection.classList.add("max-h-0", "opacity-0");
      customSection.classList.remove("max-h-[600px]", "opacity-100");
    }
  }

  // Custom member checkboxes
  const customSet = new Set(channel.customMembers ?? []);
  const checkboxes = dialog.querySelectorAll<HTMLInputElement>(
    "[data-member-checkbox]",
  );
  for (const cb of checkboxes) {
    cb.checked = customSet.has(cb.value);
    const label = cb.closest<HTMLElement>("[data-member-item]");
    if (label) {
      if (cb.checked) {
        label.classList.add(
          "bg-vspo-purple/10",
          "ring-1",
          "ring-vspo-purple/20",
        );
        label.classList.remove("hover:bg-surface-container-highest/40");
      } else {
        label.classList.remove(
          "bg-vspo-purple/10",
          "ring-1",
          "ring-vspo-purple/20",
        );
        label.classList.add("hover:bg-surface-container-highest/40");
      }
    }
  }

  // Update selected count
  updateSelectedCount(dialog, data);

  // Enable save button
  const saveBtn = dialog.querySelector<HTMLButtonElement>("[data-save-btn]");
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.classList.remove("opacity-50");
  }

  const resetBtn = dialog.querySelector<HTMLButtonElement>("[data-reset-btn]");
  if (resetBtn) {
    resetBtn.disabled = false;
    resetBtn.classList.remove("opacity-50");
  }
};

const updateSelectedCount = (dialog: HTMLElement, data: PageData) => {
  const countEl = dialog.querySelector<HTMLElement>("[data-selected-count]");
  if (!countEl) return;
  const count = dialog.querySelectorAll<HTMLInputElement>(
    "[data-member-checkbox]:checked",
  ).length;
  const template =
    data.i18n["channelConfig.members.selected"] ?? "{count} selected";
  countEl.textContent = template.replace("{count}", String(count));
};

/* ---------- Init ---------- */

/**
 * Initialize all channel action handlers.
 * Called on page load and after View Transition swaps.
 */
export const initChannelActions = () => {
  initDelete();
  initAdd();
  initEdit();
};
