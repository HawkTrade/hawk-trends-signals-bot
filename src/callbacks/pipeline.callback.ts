import type { CB_Action, Context } from "../models/telegraf.model";
import type { CreatePipeline, Pipeline } from "../models/db.model";
import { errorWrapper, groupOrSuperGroupChecker } from "../utils/helpers";
import cache from "../db/cache";
import { HawkApi } from "../utils/fetch";
import {
  createPipelineSummary,
  getPipelineSummary,
} from "../messages/pipeline.messages";
import { HawkApiResponse } from "../models/twitter.api";

async function _actionCreatePipelineCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback. Please call start");

  const key = groupOrSuperGroupChecker(ctx);
  const [, action] = ctx.callbackQuery.data.split(":") as ["", CB_Action];

  if (!cache.has(key))
    throw new Error(
      "Pipeline creation cache is seemingly empty or may have expired! Please restart the process"
    );

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  if (action === "cancel") {
    cache.delete(key);
    await ctx.answerCbQuery(
      "Pipeline creation has been successfully cancelled"
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
    "/pipeline/" + pipeline
  );
  if (error) throw error;
  if (!msg || !data) throw new Error("There is an error with the API response");

  await ctx.answerCbQuery();
  await ctx.editMessageText(getPipelineSummary(msg, data));
}

const createPipelineCb = errorWrapper(_actionCreatePipelineCb);
const removePipelineCb = errorWrapper(_removePipelineCb);
const getPipelineCb = errorWrapper(_getPipelineCb);

export { createPipelineCb, removePipelineCb, getPipelineCb };
