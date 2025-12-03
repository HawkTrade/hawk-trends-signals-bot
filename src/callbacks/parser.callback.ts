import { bold, fmt, italic } from "telegraf/format";
import { getParserMessage } from "../messages/sources_parsers.messages";
import type { Context, Parser } from "../models/telegraf.model";
import { HawkApi } from "../utils/fetch";
import { errorWrapper } from "../utils/helpers";
import { getDefaultSession } from "../utils";

async function getPipelineParserCb_(ctx: Context, parser: Parser, pipeline: string) {
  const path = parser === "llm" ? "prompt" : "regex";
  await ctx.sendChatAction("typing");

  const { data, msg, error } = await HawkApi.get(`/${path}/${pipeline}`);
  if (error) throw error;

  const message = getParserMessage(msg, data);
  await ctx.reply(message);
}

async function addPipelineParserCb_(ctx: Context, parser: Parser) {
  const msg =
    parser === "regex"
      ? "Please enter the regex: (wrong regex syntax and missing fields like asset and direction in syntax will result in an error)"
      : "Please enter the new LLM prompt that parses the expected message";

  const { message_id } = await ctx.reply(msg, {
    reply_markup: { force_reply: true },
  });
  ctx.session.state = "parser_action";
  ctx.session.toDelete.push(message_id);
}

async function removePipelineParserCb_(ctx: Context, parser: Parser, pipeline: string) {
  await ctx.sendChatAction("typing");
  if (parser === "llm") {
    const { error, msg } = await HawkApi.delete(`llm/${pipeline}`);
    if (error) throw new Error(error);

    await ctx.reply(msg!);
    return;
  }

  const { data, msg, error } = await HawkApi.get(`/regex/${pipeline}`);
  if (error) throw error;
  if (!data || !msg) throw new Error("API response is malformed.");

  if (!data.length) throw new Error(msg + " to remove from");

  const keyboard = data.map((pattern) => [
    {
      text: pattern,
      callback_data: `rem_rgx:${encodeURIComponent(pattern)}`,
    },
  ]);

  const message = fmt`${bold(msg)}
    
  ${italic`Select from the list below, the regex pattern to remove`} 
    `;

  await ctx.reply(message, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

async function _removePipelineRegexCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) throw new Error("Callback Query data is empty");

  const [, encoded] = ctx.callbackQuery.data.split(":") as [string, string];
  const pipeline = ctx.session.pipeline;
  const pattern = decodeURIComponent(encoded);

  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await ctx.sendChatAction("typing");

  const { msg, error } = await HawkApi.delete("/regex", {
    pattern,
    pipeline,
  });
  if (error) throw error;
  if (!msg) throw new Error("API response is malformed");

  await ctx.reply(msg);
  ctx.session = getDefaultSession();
}

const removePipelineRegexCb = errorWrapper(_removePipelineRegexCb);

export { getPipelineParserCb_, removePipelineParserCb_, addPipelineParserCb_, removePipelineRegexCb };
