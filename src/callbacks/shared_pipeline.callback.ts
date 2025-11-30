import type { Action, Context, Parser, Source } from "../models/telegraf.model";
import type { LocalPipeline } from "../models/db.model";
import { errorWrapper } from "../utils/helpers";
import { HawkApi } from "../utils/fetch";
import { HawkApiResponse } from "../models/twitter.api";
import { bold, fmt } from "telegraf/format";
import { addPipelineSourceCb_, getPipelineSourceCb_, removePipelineSourceCb_ } from "./source.callback";
import { addPipelineParserCb_, getPipelineParserCb_, removePipelineRegexCb_ } from "./parser.callback";

async function _selectedPipelineCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) throw new Error("No data in the callback query");
  const pipeline = ctx.callbackQuery.data.split(":")[1];
  if (!pipeline) throw new Error("Pipeline in callback data is undefined");

  const { source_action, parser_action } = ctx.session;
  ctx.session.pipeline = pipeline;

  await ctx.answerCbQuery();
  await ctx.deleteMessage();

  if (source_action) {
    const [source, action] = source_action.split(":") as [Source, Action];
    switch (action) {
      case "get":
        await getPipelineSourceCb_(ctx, source, pipeline);
        break;
      case "add":
        await addPipelineSourceCb_(ctx, source);
        break;
      case "rem":
        await removePipelineSourceCb_(ctx, source, pipeline);
        break;
    }
  } else if (parser_action) {
    const [parser, action] = parser_action.split(":") as [Parser, Action];
    switch (action) {
      case "get":
        await getPipelineParserCb_(ctx, parser, pipeline);
        break;
      case "rem":
        if (parser === "regex") await removePipelineRegexCb_(ctx, pipeline);
        break;
      case "add":
        await addPipelineParserCb_(ctx, parser);
        break;
    }
  }
}

async function sharedSelectPipelineCb_(ctx: Context) {
  await ctx.sendChatAction("typing");
  const { data: pipelines, error } = await HawkApi.get<HawkApiResponse<LocalPipeline[]>>("/pipeline?with_hawk=false");

  if (error) throw error;
  if (!pipelines || !pipelines.length) throw new Error("There are no Pipelines to select from");

  const keyboard = [];
  for (let i = 0; i < pipelines.length; i += 2) {
    keyboard.push(
      pipelines.slice(i, i + 2).map((p) => ({
        text: p.name,
        callback_data: `selected_pipeline:${p.pipeline}`,
      }))
    );
  }
  await ctx.reply(fmt`${bold("Select a pipeline to complete this action")}`, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
}

const selectedPipelineCb = errorWrapper(_selectedPipelineCb);

export { selectedPipelineCb, sharedSelectPipelineCb_ };
