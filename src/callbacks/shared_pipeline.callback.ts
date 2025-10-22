import type { Action, Context, Parser } from "../models/telegraf.model";
import type { LocalPipeline } from "../models/db.model";
import { errorWrapper } from "../utils/helpers";
import { HawkApi } from "../utils/fetch";
import { HawkApiResponse } from "../models/twitter.api";
import { bold, fmt } from "telegraf/format";
import { getChannelNames } from "../utils/utils";
import { getSourcesMessage } from "../messages/sources.messages";

async function _selectedPipelineCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback query");
  const pipeline = ctx.callbackQuery.data.split(":")[1];
  if (!pipeline) throw new Error("Pipeline in callback data is undefined");

  const { source_action, parser_action } = ctx.session;
  ctx.session.pipeline = pipeline;

  if (source_action) {
    const [source, action] = source_action.split(":");
    if (action === "get") {
      await ctx.sendChatAction("typing");
      const { data, msg, error } = await HawkApi.get(
        `/source?source=${source}&pipeline=${pipeline}`
      );
      if (error) throw error;

      const sources =
        (source === "telegram" || source === "tg_bot") && data
          ? await getChannelNames(data, ctx)
          : data;
      const message = getSourcesMessage(msg, sources);

      await ctx.reply(message);
      return;
    }
    await ctx.reply(
      fmt`${bold(
        `Please enter the ${
          source === "rss"
            ? "feed URL"
            : source === "x"
            ? "X username"
            : source === "telegram"
            ? "Channel username"
            : "Channel ID"
        }`
      )}`,
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
      const { msg, error, data } = await HawkApi.get(url + "/" + pipeline);
      if (error) return await ctx.reply(error);

      if (parser === "llm") await ctx.reply(msg || "Shouldn't happen");
      else
        await ctx.reply(msg + "\n\n" + data?.map((r) => `• ${r}`).join("\n"));
      return;
    } else if (action === "rem") {
      const { data, error } = await HawkApi.get("/regex/" + pipeline);
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
}

async function sharedSelectPipelineCb_(ctx: Context) {
  await ctx.sendChatAction("typing");
  const { data: pipelines, error } = await HawkApi.get<
    HawkApiResponse<LocalPipeline[]>
  >("/pipeline?with_hawk=false");
  if (error) throw error;
  if (!pipelines || !pipelines.length)
    throw new Error("There are no Pipelines to select from");

  const keyboard = [];

  for (let i = 0; i < pipelines.length; i += 2) {
    keyboard.push(
      pipelines.slice(i, i + 2).map((p) => ({
        text: p.name,
        callback_data: `selected_pipeline:${p.pipeline}`,
      }))
    );
  }
  await ctx.reply(fmt`${bold("Select a pipeline to complete this action")}`),
    {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };
}

const selectedPipelineCb = errorWrapper(_selectedPipelineCb);

export { selectedPipelineCb, sharedSelectPipelineCb_ };
