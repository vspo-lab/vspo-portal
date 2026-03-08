/** Channel 設定アクションの intent 値 */
const ActionIntent = {
  UPDATE_CHANNEL: "update-channel",
  ENABLE_CHANNEL: "enable-channel",
  DISABLE_CHANNEL: "disable-channel",
} as const;

type ActionIntentValue = (typeof ActionIntent)[keyof typeof ActionIntent];

export { ActionIntent, type ActionIntentValue };
