import type { Context } from "../models/telegraf.model";
import { HawkSignalsAndTrendsAPI as HSTAPI } from "../utils/fetch";
import type { HawkSignalsAndTrendsAPIResponse as Res } from "../models/twitter.api";
import type { Pipeline } from "../models/db.model";
import { code } from "telegraf/format";

async function createPipelineHandler(ctx: Context) {
  try {
    ctx.session.state = "pipeline_create";
    ctx.session.parser_action = "pipeline:add";
    await ctx.reply("Please enter the Title for this new pipeline:", {
      reply_markup: { force_reply: true },
    });
  } catch (error) {
    console.error("createPipelineHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function setPipelineStrategyHandler(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message)) return;

  const text = ctx.message.text;
  try {
    ctx.session.state = "parser_action";
    ctx.session.parser_action = "pipeline:add";
    ctx.session.pipeline = text.trim();

    await ctx.reply("Please enter the strategy id for this new pipeline:", {
      reply_markup: { force_reply: true },
    });
  } catch (error) {
    console.error("setPipelineStrategyHandler error", error);
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
    const { data, error, msg } = await HSTAPI.get<Res<Pipeline[]>>("/pipeline");
    if (error) return await ctx.reply(error);

    await ctx.reply(
      msg +
        "\n\n" +
        data?.map((r) => `• ${r.pipeline}  — ${code(r.strategyId)}`).join("\n")
    );
  } catch (error) {
    console.error("getPipelinesHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function sharedGetPipelineCallback(ctx: Context) {
  await ctx.sendChatAction("typing");

  const { data: pipelines } = await HSTAPI.get<Res>("/pipeline");
  if (!pipelines) throw new Error("No Pipelines to select from");

  await ctx.reply("Select a pipeline:", {
    reply_markup: {
      inline_keyboard: pipelines.map((p: any) => [
        {
          text: p.pipeline,
          callback_data: `pipeline_select:${p.pipeline}`,
        },
      ]),
    },
  });
}

export {
  getPipelinesHandler,
  createPipelineHandler,
  removePipelineHandler,
  setPipelineStrategyHandler,
  sharedGetPipelineCallback,
};
