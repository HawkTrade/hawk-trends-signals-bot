import type { Context } from "../models/telegraf.model";
import cache from "../db/cache";
import { createPipelineMessage } from "../messages/pipeline.messages";
import { errorWrapper, groupOrSuperGroupChecker } from "../utils/helpers";

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

// async function removePipelineHandler(ctx: Context) {
//   try {
//     const { data, error } = await HSTAPI.get<Res>("/pipeline");
//     if (error) return await ctx.reply(error);
//     if (!data || data.length <= 1) {
//       return await ctx.reply(
//         "No other pipelines save for general, exists and hence cannot be removed."
//       );
//     }

//     const pipelines = data.filter((p) => p !== "general");
//     const keyboard = pipelines.map((pipeline) => [
//       {
//         text: pipeline,
//         callback_data: `pipeline_remove:${pipeline}`,
//       },
//     ]);

//     await ctx.reply("Select a pipeline to remove:", {
//       reply_markup: { inline_keyboard: keyboard },
//     });
//   } catch (error) {
//     console.error("removePipelineHandler error", error);
//     await ctx.reply("An error occurred. Please try again later.");
//   }
// }

// async function getPipelinesHandler(ctx: Context) {
//   try {
//     const { data, error, msg } = await HSTAPI.get<Res<Pipeline[]>>("/pipeline");
//     if (error) return await ctx.reply(error);

//     await ctx.reply(
//       msg +
//         "\n\n" +
//         data?.map((r) => `• ${r.pipeline}  — ${code(r.strategyId)}`).join("\n")
//     );
//   } catch (error) {
//     console.error("getPipelinesHandler error", error);
//     await ctx.reply("An error occurred. Please try again later.");
//   }
// }

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

export {
  createPipelineCmd,
  cancelPipelineCmd,
  // getPipelinesHandler,
  // removePipelineHandler,
  // sharedGetPipelineCallback,
};
