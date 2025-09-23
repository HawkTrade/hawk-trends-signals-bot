import { ADMIN_IDS } from "../constants";
import type { Context } from "../models/telegraf.model";
import { getDefaultSession } from "../utils";
import botCommands from "./commands";

async function startCmd(ctx: Context) {
  try {
    if (!ctx.message) return null;
    const fromId = ctx.message.from.id;

    const isAdmin = ADMIN_IDS.includes(fromId);
    if (isAdmin) ctx.session = getDefaultSession();

    await ctx.reply("Hello 🫡");
  } catch (error) {
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function helpCmd(ctx: Context) {
  const helpText = botCommands
    .map((c) => `/${c.command} - ${c.description}`)
    .join("\n");

  await ctx.reply(`Here are the available commands:\n\n${helpText}`);
}

export { startCmd, helpCmd };
