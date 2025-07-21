import { Command, register } from "discord-hono";

const registerCommands = [
  new Command("setting", "Allows users to configure the bot settings."),
  // new Command("help", "response help").options(new Option("text", "with text")),
];

register(
  registerCommands,
  process.env.DISCORD_APPLICATION_ID,
  process.env.DISCORD_TOKEN,
);
