import type { Context } from "../models/telegraf.model";
// import { ADMIN_IDS } from "../constants";
import { HawkSignalsAndTrendsAPI as HSTAPI } from "../utils/fetch";
import type { HawkSignalsAndTrendsAPIResponse as Res } from "../models/twitter.api";

async function getAdmins() {
  const { data } = await HSTAPI.get<Res<number[]>>("/admin");
  return data || [];
}

async function adminCheck(ctx: Context) {
  if (!ctx.message) return null;
  const fromId = ctx.message.from.id;

  const admins = await getAdmins();
  const isAdmin = admins.includes(fromId);
  if (!isAdmin) {
    throw new Error("This is an admin only command");
  }
}

async function adminCheck_returnsText(ctx: Context) {
  const { message, text } = ctx;
  if (!message || !text) return null;

  const fromId = message.from.id;
  const admins = await getAdmins();
  const isAdmin = admins.includes(fromId);
  if (!isAdmin) {
    throw new Error("This is an admin only command");
  }

  return text;
}

export { adminCheck, adminCheck_returnsText };
