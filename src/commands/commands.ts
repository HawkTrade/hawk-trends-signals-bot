import { BotCommand } from "telegraf/typings/core/types/typegram";

const botCommands: BotCommand[] = [
  { command: "start", description: "Start the bot and get a welcome message" },
  { command: "add_source", description: "Add a new source to monitor" },
  { command: "remove_source", description: "Remove a source" },
  {
    command: "get_sources",
    description: "List all the data sources for a given source",
  },
  { command: "add_regex", description: "Add a new regex pattern for parsing" },
  { command: "remove_regex", description: "Remove an existing regex pattern" },
  { command: "get_regexes", description: "List all regex patterns" },
  { command: "set_prompt", description: "Set a new LLM prompt for parsing" },
  { command: "get_prompts", description: "View the current LLM prompt" },
  { command: "add_admin", description: "Add a new admin user" },
  { command: "remove_admin", description: "Remove an admin user" },
  { command: "get_admins", description: "List all admin users" },
  { command: "create_pipeline", description: "Create a new data pipeline" },
  { command: "remove_pipeline", description: "Remove an existing pipeline" },
  { command: "get_pipelines", description: "List all available pipelines" },
  {
    command: "edit_pipeline",
    description: "Edit trade config of an existing pipeline",
  },
  {
    command: "cancel_pipeline_creation",
    description: "removes from cache,pipeline being created",
  },
  { command: "help", description: "Show this help message" },
];

export default botCommands;
