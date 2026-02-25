import { Context } from "../models/telegraf.model";
import { BinanceAccount } from "../models/db.model";
import { errorWrapper } from "../utils/helpers";
import cache from "../db/cache";
import { typeMsg } from "../messages/binance.messages";
import { HawkApi } from "../utils/fetch";
import { getDefaultSession, to_delete } from "../utils";

async function _addBinanceAccountMsg(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message)) throw new Error("No message was provided");

  const text = ctx.message.text.trim();
  const cacheKey = `binance_account:${ctx.from?.id}`;

  let cached = cache.get(cacheKey);
  if (!cached) throw new Error("Binance account creation session expired. Please start over.");

  const account: Partial<BinanceAccount> = JSON.parse(cached);
  if (!account.name) throw new Error("Binance Account Name is missing");
  ctx.session.toDelete.push(ctx.message.message_id);

  if (!account.apiKey) {
    account.apiKey = text;
    cache.set(cacheKey, JSON.stringify(account));

    const keyboard = [
      [
        { text: "Spot", callback_data: "binance_type:spot" },
        { text: "Futures", callback_data: "binance_type:futures" },
      ],
      [{ text: "Both", callback_data: "binance_type:both" }],
    ];

    const { message_id } = await ctx.reply(typeMsg, { reply_markup: { inline_keyboard: keyboard } });
    ctx.session.toDelete.push(message_id);
  } else if (!account.apiSecret) {
    account.apiSecret = text;

    const { msg, error } = await HawkApi.post("/binance-account", account);
    if (error) throw error;
    if (!msg) throw new Error("API response is malformed!");

    await ctx.reply(msg);
    await to_delete(ctx);
    ctx.session = getDefaultSession();
    cache.delete(cacheKey);
  } else if (!account.type) {
    throw new Error("Account type must be selected via inline keyboard");
  } else throw new Error("How did we get here?");
}

const addBinanceAccountMsg = errorWrapper(_addBinanceAccountMsg);

export { addBinanceAccountMsg };
