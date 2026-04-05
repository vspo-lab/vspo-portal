/**
 * Client-side controller for channel CRUD operations.
 * Uses optimistic DOM updates instead of full page reloads.
 *
 * @precondition Page must contain #channel-data script with JSON payload
 * @postcondition All modal interactions and data mutations happen client-side
 */
import { actions } from "astro:actions";

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

let currentData: PageData | null = null;
let abortController: AbortController | null = null;

const getPageData = (): PageData => {
  if (currentData) return currentData;
  const el = document.getElementById("channel-data");
  if (!el?.textContent) throw new Error("Missing #channel-data");
  currentData = JSON.parse(el.textContent);
  return currentData!;
};

const persistPageData = (data: PageData) => {
  currentData = data;
  const el = document.getElementById("channel-data");
  if (el) el.textContent = JSON.stringify(data);
};

/* ---------- Helpers ---------- */

const languageLabel = (lang: string, i18n: Record<string, string>): string => {
  const key = lang.trim().toLowerCase();
  if (!key) return i18n["language.unknown"] ?? "";
  return (
    i18n[`language.${key}`] ?? i18n["language.unknown"] ?? key.toUpperCase()
  );
};

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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

  const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  iconSvg.setAttribute(
    "class",
    `h-5 w-5 shrink-0 ${type === "success" ? "text-vspo-purple" : "text-destructive"}`,
  );
  iconSvg.setAttribute("fill", "none");
  iconSvg.setAttribute("stroke", "currentColor");
  iconSvg.setAttribute("viewBox", "0 0 24 24");
  iconSvg.setAttribute("aria-hidden", "true");
  const iconPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  iconPath.setAttribute("stroke-linecap", "round");
  iconPath.setAttribute("stroke-linejoin", "round");
  iconPath.setAttribute("stroke-width", "2");
  iconPath.setAttribute(
    "d",
    type === "success"
      ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z",
  );
  iconSvg.appendChild(iconPath);

  const msgSpan = document.createElement("span");
  msgSpan.className = "flex-1";
  msgSpan.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className =
    "shrink-0 rounded-lg p-2 text-on-surface-variant hover:text-on-surface cursor-pointer";
  closeBtn.setAttribute("aria-label", "close");
  closeBtn.innerHTML = `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;
  closeBtn.addEventListener("click", () => toast.remove());

  toast.appendChild(iconSvg);
  toast.appendChild(msgSpan);
  toast.appendChild(closeBtn);

  const alertsContainer = document.querySelector("[data-alerts]");
  if (alertsContainer) {
    alertsContainer.appendChild(toast);
  }

  setTimeout(() => toast.remove(), 5000);
};

/* ---------- Modal helpers ---------- */

const openDialog = (dialog: HTMLDialogElement) => {
  if (dialog.open) return;
  dialog.showModal();
};

const closeDialog = (dialog: HTMLDialogElement) => {
  dialog.close();
};

/* ---------- DOM update helpers ---------- */

const memberTypeLabel = (mt: string, i18n: Record<string, string>): string =>
  i18n[`memberType.${mt}`] ?? mt;

const createRowHtml = (
  ch: ChannelConfig,
  i18n: Record<string, string>,
): string => {
  const name = escapeHtml(ch.channelName);
  const id = escapeHtml(ch.channelId);
  const langLabel = escapeHtml(languageLabel(ch.language, i18n));
  const mtLabel = escapeHtml(memberTypeLabel(ch.memberType, i18n));
  const statusActive = ch.enabled;
  const statusLabel = escapeHtml(
    statusActive
      ? (i18n["channel.status.active"] ?? "Active")
      : (i18n["channel.status.paused"] ?? "Paused"),
  );
  const editLabel = escapeHtml(i18n["channel.edit"] ?? "Edit");
  const deleteLabel = escapeHtml(i18n["channel.delete"] ?? "Delete");

  const statusHtml = statusActive
    ? `<div class="flex items-center gap-2"><div class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-success shadow-sm shadow-success/50"></span></div><span class="text-[10px] font-bold uppercase tracking-wider text-success">${statusLabel}</span></div>`
    : `<div class="flex items-center gap-2"><span class="inline-flex h-2 w-2 rounded-full bg-on-surface-variant/40"></span><span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">${statusLabel}</span></div>`;

  return `<td class="px-6 py-4 sm:px-8"><div class="flex items-center gap-3"><div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-vspo-purple/10 text-vspo-purple"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg></div><div><p class="text-sm font-semibold text-on-surface">${name}</p><p class="text-[10px] text-on-surface-variant/60">${id}</p></div></div></td><td class="hidden px-6 py-4 sm:table-cell sm:px-8"><span class="rounded bg-surface-container-highest px-2.5 py-1 text-[10px] font-bold text-on-surface">${langLabel}</span></td><td class="hidden px-6 py-4 text-xs font-medium text-on-surface-variant md:table-cell sm:px-8">${mtLabel}</td><td class="hidden px-6 py-4 lg:table-cell sm:px-8">${statusHtml}</td><td class="px-6 py-4 sm:px-8"><div class="flex items-center justify-end gap-1"><button type="button" data-action-edit="${id}" class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-vspo-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vspo-purple/50 cursor-pointer" aria-label="${editLabel} #${name}"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button><button type="button" data-action-delete="${id}" class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 cursor-pointer" aria-label="${deleteLabel} #${name}"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div></td>`;
};

const restripeRows = () => {
  const rows = document.querySelectorAll<HTMLElement>("[data-channel-row]");
  rows.forEach((row, i) => {
    row.classList.remove("bg-surface", "bg-surface-container-lowest");
    row.classList.add(
      i % 2 === 0 ? "bg-surface" : "bg-surface-container-lowest",
    );
  });
};

const updateStats = (data: PageData) => {
  const total = document.querySelector("[data-stat-total]");
  if (total) total.textContent = String(data.channels.length);

  const desc = document.querySelector("[data-channels-desc]");
  if (desc) {
    const template =
      data.i18n["dashboard.channelsCount"] ?? "{total} channels registered";
    desc.textContent = template.replace(
      "{total}",
      String(data.channels.length),
    );
  }

  const langContainer = document.querySelector("[data-stat-languages]");
  if (langContainer) {
    langContainer.textContent = "";
    const langs = [...new Set(data.channels.map((c) => c.language))];
    if (langs.length === 0) {
      const empty = document.createElement("span");
      empty.className = "text-sm text-on-surface-variant";
      empty.textContent = "—";
      langContainer.appendChild(empty);
    } else {
      for (const lang of langs) {
        const chip = document.createElement("span");
        chip.className =
          "rounded bg-surface-container-highest px-2 py-0.5 text-[10px] font-bold text-vspo-purple";
        chip.textContent = languageLabel(lang, data.i18n);
        langContainer.appendChild(chip);
      }
    }
  }

  const membersContainer = document.querySelector("[data-stat-members]");
  if (membersContainer) {
    membersContainer.textContent = "";
    const types = [...new Set(data.channels.map((c) => c.memberType))];
    if (types.length === 0) {
      const empty = document.createElement("span");
      empty.className = "text-sm text-on-surface-variant";
      empty.textContent = "—";
      membersContainer.appendChild(empty);
    } else {
      for (const mt of types) {
        const chip = document.createElement("span");
        chip.className = "text-sm font-medium text-on-surface";
        chip.textContent = memberTypeLabel(mt, data.i18n);
        membersContainer.appendChild(chip);
      }
    }
  }
};

const updateRowCells = (
  channelId: string,
  updates: Partial<ChannelConfig>,
  i18n: Record<string, string>,
) => {
  const row = document.querySelector<HTMLElement>(
    `[data-channel-row="${channelId}"]`,
  );
  if (!row) return;

  if (updates.language !== undefined) {
    const langCell = row.querySelector("td:nth-child(2) span");
    if (langCell) langCell.textContent = languageLabel(updates.language, i18n);
  }

  if (updates.memberType !== undefined) {
    const mtCell = row.querySelector("td:nth-child(3)");
    if (mtCell) mtCell.textContent = memberTypeLabel(updates.memberType, i18n);
  }
};

/* ---------- Delete ---------- */

const initDelete = (signal: AbortSignal) => {
  const dialog = document.getElementById(
    "delete-channel-modal",
  ) as HTMLDialogElement | null;
  if (!dialog) return;

  document.addEventListener(
    "click",
    (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        "[data-action-delete]",
      );
      if (!btn || !dialog) return;

      const data = getPageData();
      const channelId = btn.dataset.actionDelete;
      if (!channelId) return;
      const channel = data.channels.find((c) => c.channelId === channelId);
      if (!channel) return;

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
    },
    { signal },
  );

  dialog
    .querySelector("[data-modal-cancel]")
    ?.addEventListener("click", () => closeDialog(dialog), { signal });

  dialog.addEventListener(
    "click",
    (e) => {
      if (e.target === dialog) closeDialog(dialog);
    },
    { signal },
  );

  dialog.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") closeDialog(dialog);
    },
    { signal },
  );

  dialog.querySelector("[data-modal-confirm]")?.addEventListener(
    "click",
    async () => {
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

      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.classList.remove("opacity-50");
      }

      if (error) {
        closeDialog(dialog);
        showToast(error.message, "error");
        return;
      }

      closeDialog(dialog);
      showToast(data.i18n["toast.deleteSuccess"] ?? "Deleted.");

      // Optimistic DOM update
      const row = document.querySelector(`[data-channel-row="${channelId}"]`);
      if (row) {
        row.classList.add("opacity-0", "transition-opacity", "duration-200");
        setTimeout(() => {
          row.remove();
          restripeRows();
        }, 200);
      }

      const updated: PageData = {
        ...data,
        channels: data.channels.filter((c) => c.channelId !== channelId),
      };
      persistPageData(updated);
      updateStats(updated);
    },
    { signal },
  );
};

/* ---------- Add ---------- */

const initAdd = (signal: AbortSignal) => {
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

  document.addEventListener(
    "click",
    (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-action-add]",
      );
      if (!btn || !dialog) return;

      openDialog(dialog);
      loadChannels();
    },
    { signal },
  );

  dialog
    .querySelector("[data-modal-close]")
    ?.addEventListener("click", () => closeDialog(dialog), { signal });
  dialog
    .querySelector("[data-modal-cancel]")
    ?.addEventListener("click", () => closeDialog(dialog), { signal });
  dialog.addEventListener(
    "click",
    (e) => {
      if (e.target === dialog) closeDialog(dialog);
    },
    { signal },
  );
  dialog.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") closeDialog(dialog);
    },
    { signal },
  );

  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  searchInput?.addEventListener(
    "input",
    () => {
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
    },
    { signal },
  );

  const loadChannels = async () => {
    if (!listContainer) return;

    if (loadingEl) loadingEl.classList.remove("hidden");
    if (noChannelsEl) noChannelsEl.classList.add("hidden");
    listContainer.textContent = "";
    if (searchInput) searchInput.value = "";

    const data = getPageData();
    const registeredIds = new Set(data.channels.map((c) => c.channelId));

    let res: Response;
    try {
      res = await fetch(`/api/guilds/${data.guildId}/channels`);
    } catch {
      if (loadingEl) loadingEl.classList.add("hidden");
      showToast(
        data.i18n["dashboard.error"]?.replace("{message}", "Network error") ??
          "Network error",
        "error",
      );
      return;
    }
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

    for (const ch of unregistered) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-channel-item", "");
      btn.setAttribute("data-channel-name", ch.name.toLowerCase());
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", "false");
      btn.className =
        "flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition-colors duration-[--duration-fast] hover:bg-surface-container-highest/30 cursor-pointer";
      const content = document.createElement("span");
      content.className = "flex items-center gap-2";
      const icon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      icon.setAttribute("class", "h-4 w-4 shrink-0 text-on-surface-variant");
      icon.setAttribute("fill", "none");
      icon.setAttribute("stroke", "currentColor");
      icon.setAttribute("viewBox", "0 0 24 24");
      icon.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("d", "M7 20l4-16m2 16l4-16M6 9h14M4 15h14");
      icon.appendChild(path);
      const channelName = document.createElement("span");
      channelName.textContent = ch.name;
      content.appendChild(icon);
      content.appendChild(channelName);
      const addLabel = document.createElement("span");
      addLabel.className = "text-xs font-medium text-vspo-purple";
      addLabel.textContent = data.i18n["channel.add.submit"] ?? "Add";
      btn.appendChild(content);
      btn.appendChild(addLabel);

      btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.classList.add("opacity-50");

        const latestData = getPageData();
        const { error } = await actions.addChannel({
          guildId: latestData.guildId,
          channelId: ch.id,
        });

        if (error) {
          btn.disabled = false;
          btn.classList.remove("opacity-50");
          showToast(error.message, "error");
          return;
        }

        closeDialog(dialog);
        showToast(latestData.i18n["toast.addSuccess"] ?? "Channel added.");

        // Optimistic DOM update
        const newChannel: ChannelConfig = {
          channelId: ch.id,
          channelName: ch.name,
          enabled: true,
          language: "default",
          memberType: "all",
        };

        const updated: PageData = {
          ...latestData,
          channels: [...latestData.channels, newChannel],
        };
        persistPageData(updated);

        // Remove empty state if present
        const emptyState = document.querySelector("[data-empty-state]");
        if (emptyState) emptyState.remove();

        // Add row to table
        const tbody = document.querySelector("[data-table-body]");
        if (tbody) {
          const tr = document.createElement("tr");
          tr.setAttribute("data-channel-row", ch.id);
          tr.className =
            "group transition-colors duration-200 hover:bg-surface-container-highest/30";
          tr.innerHTML = createRowHtml(newChannel, updated.i18n);
          tbody.appendChild(tr);
          restripeRows();
        }

        updateStats(updated);
      });

      listContainer.appendChild(btn);
    }

    for (const ch of allChannels.filter((c) => registeredIds.has(c.id))) {
      const div = document.createElement("div");
      div.setAttribute("data-channel-item", "");
      div.setAttribute("data-channel-name", ch.name.toLowerCase());
      div.className =
        "flex items-center justify-between rounded-lg px-3 py-3 text-sm text-on-surface-variant/50";
      const regContent = document.createElement("span");
      regContent.className = "flex items-center gap-2";
      const regIcon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      regIcon.setAttribute("class", "h-4 w-4 shrink-0");
      regIcon.setAttribute("fill", "none");
      regIcon.setAttribute("stroke", "currentColor");
      regIcon.setAttribute("viewBox", "0 0 24 24");
      regIcon.setAttribute("aria-hidden", "true");
      const regPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      regPath.setAttribute("stroke-linecap", "round");
      regPath.setAttribute("stroke-linejoin", "round");
      regPath.setAttribute("stroke-width", "2");
      regPath.setAttribute("d", "M7 20l4-16m2 16l4-16M6 9h14M4 15h14");
      regIcon.appendChild(regPath);
      const regName = document.createElement("span");
      regName.textContent = ch.name;
      regContent.appendChild(regIcon);
      regContent.appendChild(regName);
      const regLabel = document.createElement("span");
      regLabel.className = "text-xs";
      regLabel.textContent =
        data.i18n["channel.add.registered"] ?? "Registered";
      div.appendChild(regContent);
      div.appendChild(regLabel);
      listContainer.appendChild(div);
    }
  };
};

/* ---------- Edit / Config ---------- */

const initEdit = (signal: AbortSignal) => {
  const dialog = document.getElementById(
    "config-modal",
  ) as HTMLDialogElement | null;
  if (!dialog) return;

  const form = dialog.querySelector<HTMLFormElement>("#update-channel-form");
  const hiddenChannelId = form?.querySelector<HTMLInputElement>(
    'input[name="channelId"]',
  );

  document.addEventListener(
    "click",
    (e) => {
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
    },
    { signal },
  );

  dialog
    .querySelector("[data-modal-close]")
    ?.addEventListener("click", () => closeDialog(dialog), { signal });
  dialog
    .querySelector("[data-modal-cancel]")
    ?.addEventListener("click", () => closeDialog(dialog), { signal });
  dialog.addEventListener(
    "click",
    (e) => {
      if (e.target === dialog) closeDialog(dialog);
    },
    { signal },
  );
  dialog.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") closeDialog(dialog);
    },
    { signal },
  );

  // Save handler
  dialog.querySelector("[data-save-btn]")?.addEventListener(
    "click",
    async () => {
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

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove("opacity-50");
      }

      if (error) {
        showToast(error.message, "error");
        return;
      }

      closeDialog(dialog);
      showToast(data.i18n["toast.updateSuccess"] ?? "Updated.");

      // Optimistic DOM update
      const updates = {
        language,
        memberType,
        customMembers: memberType === "custom" ? customMemberIds : undefined,
      };
      updateRowCells(channelId, updates, data.i18n);

      const updated: PageData = {
        ...data,
        channels: data.channels.map((c) =>
          c.channelId === channelId ? { ...c, ...updates } : c,
        ),
      };
      persistPageData(updated);
      updateStats(updated);
    },
    { signal },
  );

  // Reset handler
  dialog.querySelector("[data-reset-btn]")?.addEventListener(
    "click",
    async () => {
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

      if (resetBtn) {
        resetBtn.disabled = false;
        resetBtn.classList.remove("opacity-50");
      }

      if (error) {
        showToast(error.message, "error");
        return;
      }

      closeDialog(dialog);
      showToast(data.i18n["toast.resetSuccess"] ?? "Reset to default.");

      // Optimistic DOM update
      const defaults = {
        language: "default",
        memberType: "all",
        customMembers: [] as string[],
      };
      updateRowCells(channelId, defaults, data.i18n);

      const updated: PageData = {
        ...data,
        channels: data.channels.map((c) =>
          c.channelId === channelId ? { ...c, ...defaults } : c,
        ),
      };
      persistPageData(updated);
      updateStats(updated);
    },
    { signal },
  );
};

const populateEditForm = (
  dialog: HTMLElement,
  channel: ChannelConfig,
  data: PageData,
) => {
  const heading = dialog.querySelector("[data-config-heading]");
  if (heading) {
    heading.textContent =
      data.i18n["channelConfig.title"]?.replace(
        "{channelName}",
        channel.channelName,
      ) ?? `#${channel.channelName}`;
  }

  const hiddenId = dialog.querySelector<HTMLInputElement>(
    'input[name="channelId"]',
  );
  if (hiddenId) hiddenId.value = channel.channelId;

  const langSelect = dialog.querySelector(
    "#language",
  ) as HTMLSelectElement | null;
  if (langSelect) langSelect.value = channel.language;

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

  updateSelectedCount(dialog, data);

  // Notify ChannelConfigForm script to sync chips
  dialog.dispatchEvent(new CustomEvent("members-updated"));

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
 * Uses AbortController to clean up previous listeners on re-init.
 */
export const initChannelActions = () => {
  // Clean up previous listeners
  if (abortController) abortController.abort();
  abortController = new AbortController();
  currentData = null;

  const { signal } = abortController;

  initDelete(signal);
  initAdd(signal);
  initEdit(signal);
};
