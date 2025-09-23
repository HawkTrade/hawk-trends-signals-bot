import type { Context, Parser } from "../models/telegraf.model";
import type { HawkSignalsAndTrendsAPIResponse as Res } from "../models/twitter.api";
import { HawkSignalsAndTrendsAPI as HSTAPI } from "../utils/fetch";

async function parserCallback(ctx: Context) {
  console.log("In parser callback");

  if (!ctx.message || !("text" in ctx.message)) return;
  if (ctx.session.state !== "parser_action") return;
  if (!ctx.message.reply_to_message || ctx.message.reply_to_message?.from?.id !== ctx.botInfo.id || !ctx.from?.id)
    return;

  console.log("Got here");

  if ("text" in ctx.message.reply_to_message) {
    try {
      const text = ctx.message.text;
      const [parser] = ctx.session.parser_action!.split(":") as [Parser];

      if (parser === "regex") {
        const { msg, error } = await HSTAPI.post<Res>("/regex/add", { pattern: text });
        await ctx.reply(msg || error || "Shouldn't happen!");
      } else if (parser === "llm") {
        const res = await HSTAPI.post<Res>("/prompt/set", { prompt: text });
        await ctx.reply(res.msg || res.error || "Shouldn't happen!");
      }
    } catch (error) {
      console.error("Error in parser callback", error);
      if (error instanceof Error) {
        return ctx.reply(error.message);
      }
      await ctx.reply("An error occurred. Please try again later.");
    } finally {
      ctx.session.state = "idle";
      ctx.session.parser_action = null;
    }
  }
}

async function removeRegexCallback(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery) || !ctx.callbackQuery.data) return;

  try {
    const [, encoded] = ctx.callbackQuery.data.split(":");
    if (!encoded) return;
    const pattern = decodeURIComponent(encoded);
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const { error, msg } = await HSTAPI.delete<Res>("regex/remove", { pattern });
    await ctx.reply(msg || error || "Shouldn't happen!");
  } catch (error) {
    console.error(error);
    await ctx.answerCbQuery("An error occurred.");
  }
}

export { removeRegexCallback, parserCallback };
