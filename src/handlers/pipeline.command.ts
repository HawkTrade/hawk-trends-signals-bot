import { Context } from "../models/telegraf.model";
import { HawkSignalsAndTrendsAPI as HSTAPI } from "../utils/fetch";
import type { HawkSignalsAndTrendsAPIResponse as Res } from "../models/twitter.api";

async function createPipelineHandler(ctx: Context) {
  try {
    ctx.session.state = "parser_action";
    ctx.session.parser_action = "pipeline:add";
    await ctx.reply("Please enter the Title for this new pipeline:", {
      reply_markup: { force_reply: true },
    });
  } catch (error) {
    console.error("createPipelineHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function removePipelineHandler(ctx: Context) {
  try {
    const { data, error } = await HSTAPI.get<Res>("/pipeline");
    if (error) return await ctx.reply(error);
    if (!data || data.length <= 1) {
      return await ctx.reply(
        "No other pipelines save for general, exists and hence cannot be removed."
      );
    }

    const pipelines = data.filter((p) => p !== "general");
    const keyboard = pipelines.map((pipeline) => [
      {
        text: pipeline,
        callback_data: `pipeline_remove:${pipeline}`,
      },
    ]);

    await ctx.reply("Select a pipeline to remove:", {
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (error) {
    console.error("removePipelineHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function getPipelinesHandler(ctx: Context) {
  try {
    const { data, error, msg } = await HSTAPI.get<Res>("/pipeline");
    if (error) return await ctx.reply(error);

    await ctx.reply(msg + "\n\n" + data?.map((r) => `• ${r}`).join("\n"));
  } catch (error) {
    console.error("getPipelinesHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function setActivePipelineHandler(ctx: Context) {
  try {
    const { data, error } = await HSTAPI.get<Res>("/pipeline");
    if (error) return await ctx.reply(error);
    if (!data || data.length <= 1) {
      return await ctx.reply(
        "No other pipelines save for general, exists and hence cannot be replaced."
      );
    }

    const keyboard = data.map((pipeline) => [
      {
        text: pipeline,
        callback_data: `pipeline_set:${pipeline}`,
      },
    ]);

    await ctx.reply("Select a pipeline to make active:", {
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (error) {
    console.error("setActivePipelineHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function getActivePipelineHandler(ctx: Context) {
  try {
    const { error, msg } = await HSTAPI.get<Res>("/active-pipeline");

    await ctx.reply(msg || error || "Shouldn't happen");
  } catch (error) {
    console.error("getActivePipelineHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

export {
  getPipelinesHandler,
  createPipelineHandler,
  removePipelineHandler,
  setActivePipelineHandler,
  getActivePipelineHandler,
};
