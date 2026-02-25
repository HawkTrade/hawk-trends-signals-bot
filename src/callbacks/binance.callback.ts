import { Context } from "../models/telegraf.model";
import { errorWrapper } from "../utils/helpers";
import cache from "../db/cache";
import { secretMsg } from "../messages/binance.messages";

async function _binanceTypeSelectedCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) throw new Error("Callback Query data is empty");

  const parts = ctx.callbackQuery.data.split(":");
  const type = parts[1];

  if (!type) throw new Error("Type not provided in callback data");

  await ctx.answerCbQuery();
  await ctx.deleteMessage();

  const cacheKey = `binance_account:${ctx.from?.id}`;
  let cached = cache.get(cacheKey);
  if (!cached) throw new Error("Binance account creation session expired. Please start over.");

  const account = JSON.parse(cached);

  if (!["spot", "futures", "both"].includes(type)) {
    throw new Error("Invalid account type. Must be spot, futures, or both.");
  }

  account.type = type;
  cache.set(cacheKey, JSON.stringify(account));

  const { message_id } = await ctx.reply(secretMsg);
  ctx.session.toDelete.push(message_id);
}

const binanceTypeSelectedCb = errorWrapper(_binanceTypeSelectedCb);

export { binanceTypeSelectedCb };
