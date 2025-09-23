import type { Context } from "../models/telegraf.model";
import { ADMIN_IDS } from "../constants";

async function adminCheck(ctx: Context) {
  if (!ctx.message) return null;

  const fromId = ctx.message.from.id;
  const isAdmin = ADMIN_IDS.includes(fromId);
  if (!isAdmin) {
    throw new Error("This is an admin only command");
  }
}

async function adminCheck_returnsText(ctx: Context) {
  const { message, text } = ctx;
  if (!message || !text) return null;

  const fromId = message.from.id;
  const isAdmin = ADMIN_IDS.includes(fromId);
  if (!isAdmin) {
    throw new Error("This is an admin only command");
  }

  return text;
}

export { adminCheck, adminCheck_returnsText };
