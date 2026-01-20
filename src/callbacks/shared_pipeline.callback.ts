import type { Action, Context, Parser, Source } from "../models/telegraf.model";
import type { LocalPipeline } from "../models/db.model";
import { errorWrapper } from "../utils/helpers";
import { HawkApi } from "../utils/fetch";
import { HawkApiResponse } from "../models/twitter.api";
import { bold, fmt } from "telegraf/format";
import { buildPaginatedKeyboard } from "../keyboards/shared.keyboards";
import {
  addPipelineSourceCb_,
  getPipelineSourceCb_,
  removePipelineSourceCb_,
} from "./source.callback";
import {
  addPipelineParserCb_,
  getPipelineParserCb_,
  removePipelineParserCb_,
} from "./parser.callback";

async function _selectedPipelineCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback query");
  const data = ctx.callbackQuery.data.split(":");
  const pipeline = data[1]; // might be part of "selected_pipeline:<id>" or "selected_pipeline:page:<n>"

  if (data[1] === "page") {
    const page = Number(data[2]);
    if (isNaN(page)) throw new Error("Invalid page number");
    await sharedSelectPipelineCb_(ctx, page);
    await ctx.answerCbQuery();
    return;
  }
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
        await removePipelineParserCb_(ctx, parser, pipeline);
        break;
      case "add":
        await addPipelineParserCb_(ctx, parser);
        break;
    }
  }
}

async function sharedSelectPipelineCb_(ctx: Context, page = 0) {
  await ctx.sendChatAction("typing");
  const { data: pipelines, error } = await HawkApi.get<
    HawkApiResponse<LocalPipeline[]>
  >("/pipeline?with_hawk=false");

  if (error) throw error;
  if (!pipelines || !pipelines.length)
    throw new Error("There are no Pipelines to select from");

  const { keyboard } = buildPaginatedKeyboard({
    data: pipelines.map((p) => ({ ...p, value: p.pipeline })),
    page,
    makeCallback: (value) => `selected_pipeline:${value}`,
    navPrefix: `selected_pipeline`,
    label: (p) => p.name,
  });

  const isPagination =
    ctx.callbackQuery &&
    "data" in ctx.callbackQuery &&
    ctx.callbackQuery.data.startsWith("selected_pipeline:page:");

  if (isPagination) {
    // If navigating, edit the existing message
    await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard });
  } else {
    // Initial call
    const { message_id } = await ctx.reply(
      fmt`${bold("Select a pipeline to complete this action")}`,
      {
        reply_markup: {
          inline_keyboard: keyboard,
        },
      },
    );
    ctx.session.toDelete.push(message_id);
  }
}

const selectedPipelineCb = errorWrapper(_selectedPipelineCb);

export { selectedPipelineCb, sharedSelectPipelineCb_ };
