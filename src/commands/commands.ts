import { BotCommand } from "telegraf/typings/core/types/typegram";

const botCommands: BotCommand[] = [
  { command: "start", description: "Start the bot and get a welcome message" },
  { command: "ping", description: "Check status of the Listeners" },
  {
    command: "poll",
    description: "Check for pending updates in sources and update them",
  },
  { command: "add_source", description: "Add a new source to monitor" },
  { command: "remove_source", description: "Remove a source" },
  {
    command: "get_sources",
    description: "List all the data sources for a given source",
  },
  {
    command: "get_pipeline_sources",
    description: "Get all data sources peculiar to a pipeline",
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
    command: "edit_pipeline_tp_sl",
    description: "Edit trade config of an existing pipeline",
  },
  {
    command: "cancel_pipeline_creation",
    description: "removes from cache,pipeline being created",
  },
  {
    command: "add_web_selectors",
    description: "Add web selectors for a blog source",
  },
  {
    command: "test_web_source",
    description: "Test selectors for a web source before adding",
  },
  {
    command: "generate_regex",
    description: "Generate a new regex pattern by passing in an example content",
  },
  { command: "backfill", description: "Request a backfill for a source" },
  { command: "start_source", description: "Start a data source" },
  { command: "stop_source", description: "Stop a data source" },
  { command: "restart_source", description: "Restart a data source" },
  { command: "help", description: "Show this help message" },
];

export default botCommands;
