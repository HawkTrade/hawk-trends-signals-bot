import type { CB_Action, Context } from "../models/telegraf.model";
import type {
  CreatePipeline,
  Pipeline,
  LocalPipeline,
} from "../models/db.model";
import { errorWrapper, groupOrSuperGroupChecker } from "../utils/helpers";
import cache from "../db/cache";
import { HawkApi } from "../utils/fetch";
import {
  createPipelineSummary,
  getPipelineSummary,
  localPipelineMessage,
  fullPipelineMessage,
} from "../messages/pipeline.messages";
import { pipelinesKeyboard } from "../keyboards/pipeline.keyboards";
import { HawkApiResponse } from "../models/twitter.api";

async function _actionCreatePipelineCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback. Please call start");

  const key = groupOrSuperGroupChecker(ctx);
  const [, action] = ctx.callbackQuery.data.split(":") as ["", CB_Action];

  if (!cache.has(key))
    throw new Error(
      "Pipeline creation cache is seemingly empty or may have expired! Please restart the process",
    );

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  if (action === "cancel") {
    cache.delete(key);
    await ctx.answerCbQuery(
      "Pipeline creation has been successfully cancelled",
    );
    return;
  }

  const partial: CreatePipeline = JSON.parse(cache.get(key) || "{}");
  await ctx.sendChatAction("typing");
  const { error, msg } = await HawkApi.post("/pipeline", partial);
  if (error) throw error;

  await ctx.answerCbQuery(msg!, { show_alert: true });
  await ctx.editMessageText(createPipelineSummary(partial, false));
}

async function _removePipelineCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback. Please call start");

  const [, pipeline] = ctx.callbackQuery.data.split(":");
  if (!pipeline) throw new Error("No pipeline was found in the callback");

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

  await ctx.sendChatAction("typing");
  const { error, msg } = await HawkApi.delete("/pipeline/" + pipeline);
  if (error) throw error;

  await ctx.answerCbQuery();
  await ctx.reply(msg!);
}

async function _getPipelineCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback. Please call start");

  const [, pipeline] = ctx.callbackQuery.data.split(":");
  if (!pipeline) throw new Error("No pipeline was found in the callback");

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

  await ctx.sendChatAction("typing");
  const { error, msg, data } = await HawkApi.get<HawkApiResponse<Pipeline>>(
    "/pipeline/" + pipeline,
  );
  if (error) throw error;
  if (!msg || !data) throw new Error("There is an error with the API response");

  await ctx.answerCbQuery();
  await ctx.editMessageText(getPipelineSummary(msg, data));
}

async function _editPipelineCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback. Please call start");

  const [, pipeline] = ctx.callbackQuery.data.split(":");
  if (!pipeline) throw new Error("No pipeline was found in the callback");

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  await ctx.answerCbQuery();
  const key = groupOrSuperGroupChecker(ctx);

  const pipeline_in_cache = cache.get(key);
  if (pipeline_in_cache)
    throw new Error(
      "A pipeline is already being created/edited. Please call /cancel_pipeline_creation to restart the process!",
    );

  cache.set(key, JSON.stringify({ pipeline }));
  ctx.session.state = "pipeline_edit";
  await ctx.editMessageText(
    "Please enter a numerical value for the default percentage take profit (e.g: 500 for 500%)",
  );
}

async function _listPipelinesCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback. Please call start");

  const parts = ctx.callbackQuery.data.split(":");
  const mode = parts[1] as "remove_pipeline" | "get_pipeline" | "edit_pipeline";
  const page = parseInt(parts[2] ?? "1", 10);

  if (!mode || isNaN(page)) throw new Error("Invalid pagination data");

  const withHawk = mode === "get_pipeline";
  const endpoint = `/pipeline?with_hawk=${withHawk}`;

  await ctx.answerCbQuery();

  if (withHawk) {
    const { data, error, msg } =
      await HawkApi.get<HawkApiResponse<Pipeline[]>>(endpoint);
    if (error) throw error;

    const keyboard = pipelinesKeyboard(data, "get_pipeline", page);
    const message = fullPipelineMessage(msg, data, page);
    await ctx.editMessageText(message, {
      reply_markup: { inline_keyboard: keyboard },
    });
  } else {
    const { data, error } =
      await HawkApi.get<HawkApiResponse<LocalPipeline[]>>(endpoint);
    if (error) throw error;

    const keyboard = pipelinesKeyboard(data, mode, page);

    const actionMap: Record<string, "remove" | "edit"> = {
      remove_pipeline: "remove",
      edit_pipeline: "edit",
    };
    const action = actionMap[mode];

    if (!action) throw new Error("Invalid mode alias");

    const message = localPipelineMessage(data, action, page);
    await ctx.editMessageText(message, {
      reply_markup: { inline_keyboard: keyboard },
    });
  }
}

const createPipelineCb = errorWrapper(_actionCreatePipelineCb);
const removePipelineCb = errorWrapper(_removePipelineCb);
const getPipelineCb = errorWrapper(_getPipelineCb);
const editPipelineCb = errorWrapper(_editPipelineCb);
const listPipelinesCb = errorWrapper(_listPipelinesCb);

export {
  createPipelineCb,
  removePipelineCb,
  getPipelineCb,
  editPipelineCb,
  listPipelinesCb,
};
