import type { Context } from "../models/telegraf.model";

async function getAdminsFromId(ids: number[], ctx: Context) {
  const admins = await Promise.all(ids.map((id) => ctx.getChatMember(id).then((res) => res.user.first_name)));
  return admins;
}

async function getChannelNames(ids: Array<string | number>, ctx: Context) {
  console.log(ids, typeof ids[0]);
  const chats = await Promise.all(
    ids.map(async (_id) => {
      const id = typeof _id === "string" && _id.includes("|") ? _id.split("|")[0] : _id;
      try {
        const chat = await ctx.telegram.getChat(id ?? _id);
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

export { getAdminsFromId, getChannelNames };
