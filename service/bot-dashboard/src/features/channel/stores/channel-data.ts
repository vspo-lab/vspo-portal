import { atom } from "nanostores";
import type { ChannelConfigType } from "../domain/channel-config";

/** Reactive channel list shared across all islands on the guild detail page */
export const $channels = atom<ChannelConfigType[]>([]);

/** Initialize with server data. Call once from the Astro page. */
export const initChannels = (channels: ChannelConfigType[]): void => {
  $channels.set(channels);
};

/** Optimistically add a channel. Returns rollback function. */
export const optimisticAdd = (
  channel: ChannelConfigType,
): (() => void) => {
  const prev = $channels.get();
  $channels.set([...prev, channel]);
  return () => $channels.set(prev);
};

/** Optimistically update a channel. Returns rollback function. */
export const optimisticUpdate = (
  channelId: string,
  patch: Partial<ChannelConfigType>,
): (() => void) => {
  const prev = $channels.get();
  $channels.set(
    prev.map((ch) =>
      ch.channelId === channelId ? { ...ch, ...patch } : ch,
    ),
  );
  return () => $channels.set(prev);
};

/** Optimistically remove a channel. Returns rollback function. */
export const optimisticRemove = (
  channelId: string,
): (() => void) => {
  const prev = $channels.get();
  $channels.set(prev.filter((ch) => ch.channelId !== channelId));
  return () => $channels.set(prev);
};
