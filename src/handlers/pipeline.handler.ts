import type { Context } from "../models/telegraf.model";
import type { CreatePipeline } from "../models/db.model";
import { errorWrapper, groupOrSuperGroupChecker } from "../utils/helpers";
import cache from "../db/cache";
import {
  createPipelineSummary,
  describePipelineMessage,
  selectBrandForPipelineMessage,
} from "../messages/pipeline.messages";
import {
  actionCreatePipelineKeyboard,
  selectBrandForPipelineKeyboard,
} from "../keyboards/pipeline.keyboards";

const CREATE_PIPELINE_STEPS: (keyof CreatePipeline)[] = [
  "pipeline",
  "description",
  "brands",
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

const createPipelineMsg = errorWrapper(_createPipelineMsg);

export { createPipelineMsg };
