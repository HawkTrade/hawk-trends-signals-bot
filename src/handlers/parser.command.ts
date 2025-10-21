import { Context } from "../models/telegraf.model";
import { HawkSignalsAndTrendsAPI as HSTAPI } from "../utils/fetch";
import type { HawkSignalsAndTrendsAPIResponse as Res } from "../models/twitter.api";
import { getAdminsFromId } from "./utils";
import { sharedGetPipelineCallback } from "./pipeline.command";

async function addRegexHandler(ctx: Context) {
  try {
    await sharedGetPipelineCallback(ctx);
    ctx.session.parser_action = "regex:add";
  } catch (error) {
    console.error(error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function removeRegexHandler(ctx: Context) {
  try {
    await sharedGetPipelineCallback(ctx);
    ctx.session.parser_action = "regex:rem";
  } catch (error) {
    console.error("removeRegexHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function getRegexHandler(ctx: Context) {
  try {
    await sharedGetPipelineCallback(ctx);
    ctx.session.parser_action = "regex:get";
  } catch (error) {
    console.error("getRegexHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function setPromptHandler(ctx: Context) {
  try {
    await sharedGetPipelineCallback(ctx);
    ctx.session.parser_action = "llm:add";
  } catch (error) {
    console.error("setPromptHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function getPromptsHandler(ctx: Context) {
  try {
    await sharedGetPipelineCallback(ctx);
    ctx.session.parser_action = "llm:get";
  } catch (error) {
    console.error("getPromptsHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function addAdminHandler(ctx: Context) {
  try {
    ctx.session.state = "parser_action";
    ctx.session.parser_action = "admin:add";
    await ctx.reply(
      "Please enter the Telegram ID of user to give admin access:",
      {
        reply_markup: { force_reply: true },
      }
    );
  } catch (error) {
    console.error("addAdminHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function removeAdminHandler(ctx: Context) {
  try {
    const { data, error } = await HSTAPI.get<Res<number[]>>("/admin");
    if (error) return await ctx.reply(error);
    if (!data || data.length === 0) {
      return await ctx.reply("No admins found.");
    }

    const admins = await getAdminsFromId(data, ctx);
    const keyboard = data.map((id, i) => [
      {
        text: admins[i] || id.toString(),
        callback_data: `admin_remove:${id}`,
      },
    ]);

    await ctx.reply("Select an admin to remove:", {
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (error) {
    console.error("removeAdminHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function getAdminHandler(ctx: Context) {
  try {
    const { data, error, msg } = await HSTAPI.get<Res<number[]>>("/admin");
    if (error) return await ctx.reply(error);

    const admins =
      data && data.length > 0 ? await getAdminsFromId(data, ctx) : [];

    await ctx.reply(msg + "\n\n" + admins.map((r) => `• ${r}`).join("\n"));
  } catch (error) {
    console.error("getAdminHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

export {
  removeRegexHandler,
  getRegexHandler,
  addRegexHandler,
  getPromptsHandler,
  setPromptHandler,
  addAdminHandler,
  removeAdminHandler,
  getAdminHandler,
};
