import type { Action, Context, Parser, Source } from "../models/telegraf.model";
import type { HawkSignalsAndTrendsAPIResponse as Res } from "../models/twitter.api";
import { HawkSignalsAndTrendsAPI as HSTAPI } from "../utils/fetch";
import { sharedGetPipelineCallback } from "./pipeline.command";
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
    await ctx.deleteMessage();

    // Get all sources for a source (x, rss etc.)
    if (action === "get") {
      await ctx.sendChatAction("typing");
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

    await sharedGetPipelineCallback(ctx);
    ctx.session.source_action = `${source}:${action}`;
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
    const { source_action, parser_action } = ctx.session;
    ctx.session.pipeline = pipeline;

    if (source_action) {
      const [source] = source_action.split(":");
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
    } else if (parser_action) {
      const [parser, action] = parser_action.split(":") as [Parser, Action];

      await ctx.sendChatAction("typing");
      if (action === "get") {
        const url = parser === "llm" ? "/prompt" : "/regex";
        const { msg, error, data } = await HSTAPI.get<Res>(
          url + "/" + pipeline
        );
        if (error) return await ctx.reply(error);

        if (parser === "llm") await ctx.reply(msg || "Shouldn't happen");
        else
          await ctx.reply(msg + "\n\n" + data?.map((r) => `• ${r}`).join("\n"));
        return;
      } else if (action === "rem") {
        const { data, error } = await HSTAPI.get<Res>("/regex/" + pipeline);
        if (error) return await ctx.reply(error);
        if (!data || data.length === 0) {
          return await ctx.reply("No regex patterns found.");
        }

        const keyboard = data.map((pattern) => [
          {
            text: pattern,
            callback_data: `regex_remove:${encodeURIComponent(pattern)}`,
          },
        ]);

        await ctx.reply("Select a regex pattern to remove:", {
          reply_markup: { inline_keyboard: keyboard },
        });

        return;
      }

      const msg =
        parser === "regex"
          ? "Please enter the regex: (wrong regex syntax and missing fields like asset and direction in syntax will result in an error)"
          : "Please enter the new LLM prompt (LLM output must match TradeRequest, missing fields like asset and direction will throw an error)";
      await ctx.reply(msg, {
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
