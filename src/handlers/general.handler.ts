import { fmt, mention } from "telegraf/format";
import cache from "../db/cache";
import type { Context } from "../models/telegraf.model";
import { HawkApi } from "../utils/fetch";
import { errorWrapper } from "../utils/helpers";
import { to_delete } from "../utils";

async function _addAdminMsg(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message))
    throw new Error("No message was provided");

  const text = ctx.message.text.trim();
  const adminId = Number(text);
  ctx.session.toDelete.push(ctx.message.message_id);

  await ctx.sendChatAction("typing");
  const { error } = await HawkApi.post("/admin", { adminId });
  if (error) throw error;

  cache.delete("admins");
  const { user } = await ctx.getChatMember(adminId);
  await ctx.reply(
    fmt`${mention(
      user.first_name,
      adminId
    )} has been successfully added as an admin to manage the Hawk Trends Bot`
  );
  await to_delete(ctx);
}

const addAdminMsg = errorWrapper(_addAdminMsg);

export { addAdminMsg };
