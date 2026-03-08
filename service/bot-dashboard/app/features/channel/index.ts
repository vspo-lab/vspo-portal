// Public API (client-safe) — internal/ の直接 import 禁止

export { ChannelConfigFormContainer as ChannelConfigForm } from "./components/ChannelConfigForm/container";
// Components
export { ChannelTableContainer as ChannelTable } from "./components/ChannelTable/container";
export { ActionIntent } from "./internal/domain/action-intent";
// Domain types (re-export type only)
export type { ChannelConfigType as ChannelConfig } from "./internal/domain/channel-config";
export type { MemberTypeValue as MemberType } from "./internal/domain/member-type";
// Pages
export { GuildDetailContainer } from "./pages/GuildDetail/container";
