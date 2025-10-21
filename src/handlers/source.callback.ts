import type { Action, Context, Source } from "../models/telegraf.model";
import type { HawkSignalsAndTrendsAPIResponse as Res } from "../models/twitter.api";
import { HawkSignalsAndTrendsAPI as HSTAPI } from "../utils/fetch";
import { getChannelNames } from "./utils";

async function sourceCallback(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message)) return;
  if (ctx.session.state !== "source_action") return;
  if (
    !ctx.message.reply_to_message ||
    ctx.message.reply_to_message?.from?.id !== ctx.botInfo.id ||
    !ctx.from?.id
  )
    return;

  if ("text" in ctx.message.reply_to_message) {
    try {
      const text = ctx.message.text;
      const [source, action] = ctx.session.source_action!.split(":") as [
        Source,
        Action
      ];

      const pipeline = ctx.session.pipeline;
      const body = { value: text, source, pipeline };
      ctx.session.pipeline = null;

      if (action === "add") {
        const { msg, error } = await HSTAPI.post<Res>("/source", body);
        await ctx.reply(msg || error || "Shouldn't happen!");
      } else if (action === "rem") {
        const res = await HSTAPI.delete<Res>("/source", body);
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
  if (
    !ctx.callbackQuery ||
    !("data" in ctx.callbackQuery) ||
    !ctx.callbackQuery.data
  )
    return;

  try {
    const [source, action] = ctx.callbackQuery.data.split(":") as [
      Source,
      Action
    ];
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    // Get all sources for a source (x, rss etc.)
    if (action === "get") {
      const { data, msg, error } = await HSTAPI.get<Res>("/source/" + source);
      if (error) return await ctx.reply(error);

      const sources =
        (source === "telegram" || source === "tg_bot") && data
          ? await getChannelNames(data, ctx)
          : data;

      await ctx.reply(
        `${msg}\n\n` + sources!.map((src) => `• ${src}`).join("\n")
      );
      return;
    }
    // Will work on handler for getting sources for a source on a specific pipeline

    const { data: pipelines } = await HSTAPI.get<Res>("/pipeline");
    if (!pipelines) throw new Error("No Pipelines to select from");

    ctx.session.source_action = `${source}:${action}`;
    await ctx.reply("Select a pipeline:", {
      reply_markup: {
        inline_keyboard: pipelines.map((p: any) => [
          {
            text: p.pipeline,
            callback_data: `pipeline_select:${p.pipeline}`,
          },
        ]),
      },
    });
  } catch (error) {
    console.error(error);
    await ctx.answerCbQuery("An error occurred.");
  }
}

async function selectPipelineCallback(ctx: Context) {
  if (
    !ctx.callbackQuery ||
    !("data" in ctx.callbackQuery) ||
    !ctx.callbackQuery.data
  )
    return;
  const pipeline = ctx.callbackQuery.data.split(":")[1];
  if (!pipeline) return;

  try {
    ctx.session.pipeline = pipeline;

    if (ctx.session.source_action) {
      const [source] = ctx.session.source_action.split(":");
      await ctx.reply(
        `Please enter the ${
          source === "rss"
            ? "feed URL"
            : source === "x"
            ? "X username"
            : source === "telegram"
            ? "Channel username"
            : // : source === "discord"
              // ? ""
              "Channel ID"
        }:`,
        {
          reply_markup: { force_reply: true },
        }
      );
      ctx.session.state = "source_action";
    }

    if (ctx.session.parser_action) {
      await ctx.reply("Please enter the value for parser:", {
        reply_markup: { force_reply: true },
      });
      ctx.session.state = "parser_action";
    }
  } catch (error) {
    console.error(error);
    await ctx.answerCbQuery("An error occurred.");
  }
}

export { selectSourceCallback, sourceCallback, selectPipelineCallback };
