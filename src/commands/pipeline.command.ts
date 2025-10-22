import type { Context } from "../models/telegraf.model";
import cache from "../db/cache";
import {
  createPipelineMessage,
  fullPipelineMessage,
  localPipelineMessage,
} from "../messages/pipeline.messages";
import { errorWrapper, groupOrSuperGroupChecker } from "../utils/helpers";
import { HawkApi } from "../utils/fetch";
import type { HawkApiResponse } from "../models/twitter.api";
import type { Pipeline, LocalPipeline } from "../models/db.model";
import { pipelinesKeyboard } from "../keyboards/pipeline.keyboards";

async function _createPipelineCmd(ctx: Context) {
  const key = groupOrSuperGroupChecker(ctx);

  const pipeline_in_cache = cache.get(key);
  if (pipeline_in_cache)
    throw new Error(
      "A pipeline is already being created. Please call /cancel_pipeline_creation to restart the process!"
    );

  cache.set(key, "{}");
  ctx.session.state = "pipeline_create";
  const { message_id } = await ctx.reply(createPipelineMessage);
  ctx.session.toDelete.push(message_id);
}

async function _cancelPipelineCmd(ctx: Context) {
  const key = groupOrSuperGroupChecker(ctx);

  const pipeline_in_cache = cache.get(key);
  if (!pipeline_in_cache)
    throw new Error(
      "No pipeline is being created. Please call /create_pipeline to start the process!"
    );

  cache.delete(key);
  const { message_id } = await ctx.reply(
    "Pipeline creation process has been successfully upended. You can call /create_pipeline to start the process!"
  );
  ctx.session.toDelete.push(message_id);
}

async function _removePipelineCmd(ctx: Context) {
  const { data, error } = await HawkApi.get<HawkApiResponse<LocalPipeline[]>>(
    "/pipeline?with_hawk=false"
  );
  if (error) throw error;

  const keyboard = pipelinesKeyboard(data, "remove_pipeline");
  const message = localPipelineMessage(data, "remove");

  const { message_id } = await ctx.reply(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
  ctx.session.toDelete.push(message_id);
  if (ctx.message?.message_id)
    ctx.session.toDelete.push(ctx.message.message_id);
}

async function _getPipelinesCmd(ctx: Context) {
  const { data, error, msg } = await HawkApi.get<HawkApiResponse<Pipeline[]>>(
    "/pipeline?with_hawk=true"
  );
  if (error) throw error;

  const keyboard = pipelinesKeyboard(data, "remove_pipeline");
  const message = fullPipelineMessage(msg, data);
  await ctx.reply(message, { reply_markup: { inline_keyboard: keyboard } });
}

// async function sharedGetPipelineCallback(ctx: Context) {
//   await ctx.answerCbQuery();
//   await ctx.deleteMessage();

//   await ctx.sendChatAction("typing");
//   const { data: pipelines } = await HSTAPI.get<Res<Pipeline[]>>("/pipeline");
//   if (!pipelines) throw new Error("No Pipelines to select from");

//   const keyboard = [];

//   for (let i = 0; i < pipelines.length; i += 2) {
//     keyboard.push(
//       pipelines.slice(i, i + 2).map((p) => ({
//         text: p.pipeline,
//         callback_data: `pipeline_select:${p.pipeline}`,
//       }))
//     );
//   }
//   await ctx.reply("Select a pipeline:", {
//     reply_markup: {
//       inline_keyboard: keyboard,
//     },
//   });
// }

const createPipelineCmd = errorWrapper(_createPipelineCmd);
const cancelPipelineCmd = errorWrapper(_cancelPipelineCmd);
const getPipelineCmd = errorWrapper(_getPipelinesCmd);
const removePipelineCmd = errorWrapper(_removePipelineCmd);

export {
  createPipelineCmd,
  cancelPipelineCmd,
  getPipelineCmd,
  removePipelineCmd,
};
