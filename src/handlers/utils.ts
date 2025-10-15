import type { Context } from "../models/telegraf.model";
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

async function getAdminsFromId(ids: number[], ctx: Context) {
  const admins = await Promise.all(
    ids.map((id) => ctx.getChatMember(id).then((res) => res.user.first_name))
  );
  return admins;
}

async function getChannelNames(
  ids: Array<string | number>,
  ctx: Context
): Promise<string[]> {
  const chats = await Promise.all(
    ids.map(async (id) => {
      try {
        const chat = await ctx.telegram.getChat(id);
        switch (chat.type) {
          case "group":
          case "supergroup":
          case "channel":
            return chat.title || `${id}`;
          default:
            return `${id}`;
        }
      } catch (err) {
        console.error(`Failed to fetch chat ${id}:`, err);
        return `${id}`;
      }
    })
  );

  return chats;
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

export { adminCheck, adminCheck_returnsText, getAdminsFromId, getChannelNames };
