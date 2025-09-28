import { Context } from "../models/telegraf.model";
import { HawkSignalsAndTrendsAPI as HSTAPI } from "../utils/fetch";
import type { HawkSignalsAndTrendsAPIResponse as Res } from "../models/twitter.api";

async function addRegexHandler(ctx: Context) {
  try {
    ctx.session.state = "parser_action";
    ctx.session.parser_action = "regex:add";
    await ctx.reply("Please enter the regex: (wrong regex syntax will result in an error)", {
      reply_markup: { force_reply: true },
    });
  } catch (error) {
    console.error(error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function removeRegexHandler(ctx: Context) {
  try {
    const { data, error } = await HSTAPI.get<Res>("/regex");
    if (error) return await ctx.reply(error);
    if (!data || data.length === 0) {
      return await ctx.reply("No regex patterns found.");
    }

    const keyboard = data.map((pattern) => [
      { text: pattern, callback_data: `regex_remove:${encodeURIComponent(pattern)}` },
    ]);

    await ctx.reply("Select a regex pattern to remove:", {
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (error) {
    console.error("removeRegexHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function getRegexHandler(ctx: Context) {
  try {
    const { data, error, msg } = await HSTAPI.get<Res>("/regex");
    if (error) return await ctx.reply(error);

    await ctx.reply(msg + "\n\n" + data?.map((r) => `• ${r}`).join("\n"));
  } catch (error) {
    console.error("getRegexHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function setPromptHandler(ctx: Context) {
  try {
    ctx.session.state = "parser_action";
    ctx.session.parser_action = "llm:add";
    await ctx.reply("Please enter the new LLM prompt:", {
      reply_markup: { force_reply: true },
    });
  } catch (error) {
    console.error("setPromptHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function getPromptsHandler(ctx: Context) {
  try {
    const { msg, error } = await HSTAPI.get<Res>("/prompt");
    if (error) return await ctx.reply(error);

    await ctx.reply(msg || "Shouldn't happen");
  } catch (error) {
    console.error("getPromptsHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function addWebhookHandler(ctx: Context) {
  try {
    ctx.session.state = "parser_action";
    ctx.session.parser_action = "webhook:add";
    await ctx.reply("Please enter the full URL:", {
      reply_markup: { force_reply: true },
    });
  } catch (error) {
    console.error("addWebhookHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function removeWebhookHandler(ctx: Context) {
  try {
    const { data, error } = await HSTAPI.get<Res>("/webhook");
    if (error) return await ctx.reply(error);
    if (!data || data.length === 0) {
      return await ctx.reply("No webhook endpoints found.");
    }

    const keyboard = data.map((uri) => [{ text: uri, callback_data: `webhook_remove:${encodeURIComponent(uri)}` }]);

    await ctx.reply("Select a webhook url to remove:", {
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (error) {
    console.error("removeWebhookHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function getWebhookHandler(ctx: Context) {
  try {
    const { data, error, msg } = await HSTAPI.get<Res>("/webhook");
    if (error) return await ctx.reply(error);

    await ctx.reply(msg + "\n\n" + data?.map((r) => `• ${r}`).join("\n"));
  } catch (error) {
    console.error("getWebhookHandler error", error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

export {
  removeRegexHandler,
  getRegexHandler,
  addRegexHandler,
  getPromptsHandler,
  setPromptHandler,
  addWebhookHandler,
  removeWebhookHandler,
  getWebhookHandler,
};
