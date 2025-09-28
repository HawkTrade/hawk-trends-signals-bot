import { BotCommand } from "telegraf/typings/core/types/typegram";

const botCommands: BotCommand[] = [
  { command: "start", description: "Start the bot and get a welcome message" },
  { command: "add_source", description: "Add a new source to monitor" },
  { command: "remove_source", description: "Remove a source" },
  { command: "get_sources", description: "List all the data sources for a given pipeline" },
  { command: "add_regex", description: "Add a new regex pattern for parsing" },
  { command: "remove_regex", description: "Remove an existing regex pattern" },
  { command: "get_regex", description: "List all regex patterns" },
  { command: "set_prompt", description: "Set a new LLM prompt for parsing" },
  { command: "get_prompts", description: "View the current LLM prompt" },
  { command: "add_webhook", description: "Add a new webhook that consumes data" },
  { command: "remove_webhook", description: "Remove an existing webhook url" },
  { command: "get_webhook", description: "List all webhook endpoints" },
  { command: "help", description: "Show this help message" },
];

export default botCommands;
