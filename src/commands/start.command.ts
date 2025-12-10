import type { Context } from "../models/telegraf.model";
import { getDefaultSession, to_delete } from "../utils";
import botCommands from "./commands";

async function startCmd(ctx: Context) {
  try {
    if (!ctx.message) return null;
    await to_delete(ctx);
    ctx.session = getDefaultSession();

    await ctx.reply("Hello 🫡");
  } catch (error) {
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function helpCmd(ctx: Context) {
  const helpText = botCommands.map((c) => `/${c.command} - ${c.description}`).join("\n");

  await ctx.reply(`Here are the available commands:\n\n${helpText}`);
}

export { startCmd, helpCmd };
