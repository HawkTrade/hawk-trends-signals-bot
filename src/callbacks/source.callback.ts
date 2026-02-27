import type { Action, Context, Source } from "../models/telegraf.model";
import { HawkApi } from "../utils/fetch";
import { errorWrapper } from "../utils/helpers";
import { getSourcesMessage, pingMessage } from "../messages/sources_parsers.messages";
import { sharedSelectPipelineCb_ } from "./shared_pipeline.callback";
import { bold, fmt, italic } from "telegraf/format";
import { getDefaultSession, to_delete } from "../utils";
import cache from "../db/cache";
import { buildPaginatedKeyboard } from "../keyboards/shared.keyboards";
import type { DataSource, HawkApiResponse, PingResponse } from "../models/twitter.api";

async function _sourceSelectedCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) throw new Error("Callback Query data is empty");

  const [source, action, pipeline] = ctx.callbackQuery.data.split(":") as [
    Source,
    Action | "get_pip" | "ping",
    string | undefined,
  ];
  await ctx.answerCbQuery();
  await ctx.deleteMessage();

  await ctx.sendChatAction("typing");
  if (action === "ping") {
    const response = await HawkApi.get<PingResponse>("/ping/" + source);

    const message = pingMessage(response);
    await to_delete(ctx);
    await ctx.reply(message);
    return;
  }

  if (action === "start" || action === "stop" || action === "restart") {
    const sourceName = source === "telegram" ? "Gram" : source.charAt(0).toUpperCase() + source.slice(1);

    const { message_id } = await ctx.reply(
      fmt`${bold(`Are you sure you wish to ${action} the ${sourceName} source?`)}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Yes", callback_data: `confirm_${action}:${source}` },
              { text: "No", callback_data: `cancel_${action}:${source}` },
            ],
          ],
        },
      },
    );
    ctx.session.toDelete.push(message_id);
    return;
  }

  if (action === "get" && !pipeline) {
    const { data, msg, error } = await HawkApi.get<HawkApiResponse<DataSource>>("/source/" + source);
    if (error) throw error;

    const message = getSourcesMessage(msg, data?.labels);

    await to_delete(ctx);
    await ctx.reply(message);
    return;
  }

  const cleanAction = action === "get_pip" ? "get" : action;
  ctx.session.parser_action = null;
  ctx.session.source_action = `${source}:${cleanAction}`;
  await sharedSelectPipelineCb_(ctx);
}

async function getPipelineSourceCb_(ctx: Context, source: Source, pipeline: string) {
  await ctx.sendChatAction("typing");
  const { data, msg, error } = await HawkApi.get<HawkApiResponse<DataSource>>(
    `/source?source=${source}&pipeline=${pipeline}`,
  );
  if (error) throw error;

  const message = getSourcesMessage(msg, data?.labels);
  await to_delete(ctx);
  await ctx.reply(message);
}

async function addPipelineSourceCb_(ctx: Context, source: Source) {
  const { message_id } = await ctx.reply(
    fmt`${bold(
      `Please enter the ${
        source === "rss"
          ? "feed URL"
          : source === "web"
            ? "blog URL"
            : source === "binance"
              ? "Name for the Binance account, no spaces (e.g ProTrader)"
              : source === "x" || source === "new_x"
                ? "X username"
                : source === "telegram"
                  ? "Channel username"
                  : "Channel ID"
      }`,
    )}`,
    {
      reply_markup: { force_reply: true },
    },
  );
  ctx.session.state = "source_action";
  ctx.session.toDelete.push(message_id);
}

async function removePipelineSourceCb_(ctx: Context, source: Source, pipeline: string) {
  await ctx.sendChatAction("typing");
  const { data, msg, error } = await HawkApi.get<HawkApiResponse<DataSource>>(
    `/source?source=${source}&pipeline=${pipeline}`,
  );
  if (error) throw error;
  if (!msg || !data) throw new Error("API response is malformed!");

  const { keyboard } = buildPaginatedKeyboard({
    data,
    page: 0,
    makeCallback: (value) => `rem_src:${source}:${value}`,
    navPrefix: `rem_src:${source}`,
  });

  cache.set("removePipelineSourceCb_data", JSON.stringify(data));

  const message = fmt`${bold(msg)}
  
${italic`Select from the list below, the sources to remove`} 
  `;
  await ctx.reply(message, { reply_markup: { inline_keyboard: keyboard } });
}

async function _removePipelineSourceCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) throw new Error("Callback Query data is empty");

  const [, source, value, page] = ctx.callbackQuery.data.split(":") as [string, Source, Action | "page", string];
  const pipeline = ctx.session.pipeline;

  if (value === "page") {
    const _data = cache.get(`removePipelineSourceCb_data`);

    if (!_data) throw new Error("This keyboard is stale. Please call the command again");
    const data: DataSource = JSON.parse(_data);

    const { keyboard } = buildPaginatedKeyboard({
      data,
      page: Number(page),
      makeCallback: (val) => `rem_src:${source}:${val}`,
      navPrefix: `rem_src:${source}`,
    });

    await ctx.editMessageReplyMarkup({
      inline_keyboard: keyboard,
    });

    return ctx.answerCbQuery();
  }

  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await to_delete(ctx);
  await ctx.sendChatAction("typing");

  const { msg, error } = await HawkApi.delete("/source", {
    source,
    value,
    pipeline,
  });

  if (error) throw error;
  if (!msg) throw new Error("API response is malformed");

  await ctx.reply(msg);
  ctx.session = getDefaultSession();
}

const sourceSelectedCb = errorWrapper(_sourceSelectedCb);
const removePipelineSourceCb = errorWrapper(_removePipelineSourceCb);

// New callback handlers for source control confirmations
async function _sourceControlConfirmCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) throw new Error("Callback Query data is empty");

  const [prefix, source] = ctx.callbackQuery.data.split(":") as [string, Source];
  const action = prefix.replace("confirm_", "") as "start" | "stop" | "restart";

  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await to_delete(ctx);
  await ctx.sendChatAction("typing");

  try {
    const { msg, error } = await HawkApi.post(`/source/${source}/${action}`);
    if (error) throw error;
    if (!msg) throw new Error("API response is malformed");

    const actionText = action.charAt(0).toUpperCase() + action.slice(1);
    const sourceName = source === "telegram" ? "Gram" : source.charAt(0).toUpperCase() + source.slice(1);

    await ctx.reply(fmt`${bold(`${sourceName} source ${actionText}ed successfully!`)}`);
  } catch (error) {
    await ctx.reply(fmt`${bold(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)}`);
  }
}

async function _sourceControlCancelCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) throw new Error("Callback Query data is empty");

  const [prefix, source] = ctx.callbackQuery.data.split(":") as [string, Source];
  const action = prefix.replace("cancel_", "") as "start" | "stop" | "restart";

  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await to_delete(ctx);

  const actionText = action.charAt(0).toUpperCase() + action.slice(1);
  const sourceName = source === "telegram" ? "Gram" : source.charAt(0).toUpperCase() + source.slice(1);

  await ctx.reply(fmt`${italic(`${actionText} action for ${sourceName} source cancelled.`)}`);
}

const sourceControlConfirmCb = errorWrapper(_sourceControlConfirmCb);
const sourceControlCancelCb = errorWrapper(_sourceControlCancelCb);

export {
  sourceSelectedCb,
  removePipelineSourceCb,
  addPipelineSourceCb_,
  getPipelineSourceCb_,
  removePipelineSourceCb_,
  sourceControlConfirmCb,
  sourceControlCancelCb,
};
