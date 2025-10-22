import type { Context } from "../models/telegraf.model";
import { errorWrapper } from "../utils/helpers";
import cache from "../db/cache";
import { HawkApi } from "../utils/fetch";
import { fmt, mention } from "telegraf/format";

async function _removeAdminCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback. Please call start");

  const removerId = ctx.from?.id;
  const [, _adminId] = ctx.callbackQuery.data.split(":");
  if (!_adminId || !removerId)
    throw new Error("No admin was given in the callback or the caller");

  const adminId = Number(_adminId);

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  await ctx.sendChatAction("typing");
  const { error } = await HawkApi.delete("/admin", {
    adminId,
  });

  if (error) throw error;
  await ctx.answerCbQuery();
  const [ping, pong] = await Promise.all([
    ctx.getChatMember(adminId),
    ctx.getChatMember(removerId),
  ]);
  await ctx.editMessageText(
    fmt`${mention(ping.user.first_name, adminId)} has been removed by ${mention(
      pong.user.first_name,
      removerId
    )} as an admin on the Hawk Trends manager Bot`
  );
  cache.delete("admins");
}

const removeAdminCb = errorWrapper(_removeAdminCb);

export { removeAdminCb };
