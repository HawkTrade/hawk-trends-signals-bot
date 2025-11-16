import type { Context } from "../models/telegraf.model";
import type { CreatePipeline, EditPipeline } from "../models/db.model";
import { errorWrapper, groupOrSuperGroupChecker } from "../utils/helpers";
import cache from "../db/cache";
import {
  createPipelineSummary,
  describePipelineMessage,
  selectBrandForPipelineMessage,
  requiresConfig,
} from "../messages/pipeline.messages";
import {
  actionCreatePipelineKeyboard,
  selectBrandForPipelineKeyboard,
  setupTradeConfiguration,
} from "../keyboards/pipeline.keyboards";
import { HawkApi } from "../utils/fetch";
import type { HawkApiResponse } from "../models/twitter.api";

const CREATE_PIPELINE_STEPS: (keyof CreatePipeline)[] = [
  "pipeline",
  "description",
  "brands",
  "tp",
  "sl",
];

function getNextStep(data: Partial<CreatePipeline>) {
  return CREATE_PIPELINE_STEPS.find(
    (key) => data[key] === undefined || data[key] === null
  );
}

async function _createPipelineMsg(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message))
    throw new Error("No message was provided");

  const text = ctx.message.text.trim();
  const key = groupOrSuperGroupChecker(ctx);

  if (!cache.has(key))
    throw new Error(
      "Pipeline creation cache is seemingly empty and may have expired! Please restart the process"
    );

  const partial: CreatePipeline = JSON.parse(cache.get(key) || "{}");
  const currentStep = getNextStep(partial);
  let replyId: number | undefined;

  switch (currentStep) {
    case "pipeline":
      partial.pipeline = text;
      replyId = (await ctx.reply(describePipelineMessage)).message_id;
      break;
    case "description":
      partial.description = text;
      replyId = (
        await ctx.reply(selectBrandForPipelineMessage, {
          reply_markup: selectBrandForPipelineKeyboard,
        })
      ).message_id;
      break;
    case "brands":
      partial.brands = [text];
      replyId = (
        await ctx.reply(requiresConfig, {
          reply_markup: setupTradeConfiguration,
        })
      ).message_id;
      break;
    case "tp":
      if (Number.isInteger(parseInt(text))) {
        partial.tp = Number(text);
        replyId = (
          await ctx.reply(
            "Please enter a numerical value for the default percentage stop loss (e.g: 50 for 50%)"
          )
        ).message_id;
      } else {
        if (text.toLowerCase() === "yes") {
          replyId = (
            await ctx.reply(
              "Please enter a numerical value for the default percentage take profit (e.g: 500 for 500%)"
            )
          ).message_id;
        } else {
          const message = createPipelineSummary(partial);
          await ctx.reply(message, {
            reply_markup: actionCreatePipelineKeyboard,
          });
        }
      }
      break;
    case "sl":
      partial.sl = Number(text);
      const message = createPipelineSummary(partial);
      await ctx.reply(message, {
        reply_markup: actionCreatePipelineKeyboard,
      });
      break;

    default:
      throw new Error("Invalid pipeline creation step");
  }
  ctx.session.toDelete.push(ctx.message.message_id);
  if (replyId) ctx.session.toDelete.push(replyId);
  cache.set(key, JSON.stringify(partial));
}

async function _editPipelineMsg(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message))
    throw new Error("No message was provided");

  const text = ctx.message.text.trim();
  const key = groupOrSuperGroupChecker(ctx);

  if (!cache.has(key))
    throw new Error(
      "Pipeline edit cache is seemingly empty and may have expired! Please restart the process"
    );

  const partial: EditPipeline = JSON.parse(cache.get(key) || "{}");
  if (!partial.pipeline)
    throw new Error("Pipeline edit session is corrupted with missing fields.");

  if (!partial.tp) {
    partial.tp = Number(text);
    const { message_id } = await ctx.reply(
      "Please enter a numerical value for the default percentage stop loss (e.g: 50 for 50%)"
    );
    ctx.session.toDelete.push(message_id);
    cache.set(key, JSON.stringify(partial));
  } else {
    partial.sl = Number(text);
    await ctx.sendChatAction("typing");

    const { pipeline, ...config } = partial;
    const { error, msg } = await HawkApi.patch<HawkApiResponse>(
      "/pipeline/" + pipeline,
      config
    );
    if (error) throw error;
    if (!msg) throw new Error("There is an error with the API response");

    cache.delete(key);
    ctx.session.state = "idle";
    await ctx.reply(msg);
  }
}

const createPipelineMsg = errorWrapper(_createPipelineMsg);
const editPipelineMsg = errorWrapper(_editPipelineMsg);

export { createPipelineMsg, editPipelineMsg };
