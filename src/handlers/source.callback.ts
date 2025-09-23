import type { Action, Context, Source } from "../models/telegraf.model";
import type { HawkSignalsAndTrendsAPIResponse as Res } from "../models/twitter.api";
import { HawkSignalsAndTrendsAPI as HSTAPI } from "../utils/fetch";

async function sourceCallback(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message)) return;
  if (ctx.session.state !== "source_action") return;
  if (!ctx.message.reply_to_message || ctx.message.reply_to_message?.from?.id !== ctx.botInfo.id || !ctx.from?.id)
    return;

  if ("text" in ctx.message.reply_to_message) {
    try {
      const text = ctx.message.text;
      const [source, action] = ctx.session.source_action!.split(":") as [Source, Action];

      const body = { value: text, source };

      if (action === "add") {
        const { msg, error } = await HSTAPI.post<Res>("/source/add", body);
        await ctx.reply(msg || error || "Shouldn't happen!");
      } else if (action === "rem") {
        const res = await HSTAPI.delete<Res>("/source/remove", body);
        await ctx.reply(res.msg || res.error || "Shouldn't happen!");
      }
    } catch (error) {
      console.error("Error in feed callback", error);
      if (error instanceof Error) {
        return ctx.reply(error.message);
      }
      await ctx.reply("An error occurred. Please try again later.");
    } finally {
      ctx.session.state = "idle";
      ctx.session.source_action = null;
    }
  }
}

async function selectSourceCallback(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery) || !ctx.callbackQuery.data) return;

  try {
    const [source, action] = ctx.callbackQuery.data.split(":") as [Source, Action];
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    if (action === "get") {
      const { data, msg, error } = await HSTAPI.get<Res>("/source/list?source=" + source);
      if (error) return await ctx.reply(error);

      await ctx.reply(`${msg}\n\n` + data!.map((src) => `• ${src}`).join("\n"));
      return;
    }

    ctx.session.source_action = `${source}:${action}`;
    ctx.session.state = "source_action";

    await ctx.reply(
      `Please enter the ${source === "rss" ? "feed URL" : source === "x" ? "X username" : "TG channel username"}:`,
      {
        reply_markup: { force_reply: true },
      }
    );
  } catch (error) {
    console.error(error);
    await ctx.answerCbQuery("An error occurred.");
  }
}

export { selectSourceCallback, sourceCallback };
