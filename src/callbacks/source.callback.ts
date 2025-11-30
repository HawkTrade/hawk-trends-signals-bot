import type { Action, Context, Source } from "../models/telegraf.model";
import { HawkApi } from "../utils/fetch";
import { getChannelNames } from "../utils/utils";
import { errorWrapper } from "../utils/helpers";
import { getSourcesMessage } from "../messages/sources_parsers.messages";
import { sharedSelectPipelineCb_ } from "./shared_pipeline.callback";
import { bold, fmt, italic } from "telegraf/format";
import { getDefaultSession } from "../utils";
import cache from "../db/cache";
import { buildPaginatedKeyboard } from "../keyboards/source.keyboards";

async function _sourceSelectedCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) throw new Error("Callback Query data is empty");

  const [source, action, pipeline] = ctx.callbackQuery.data.split(":") as [
    Source,
    Action | "get_pip",
    string | undefined
  ];
  await ctx.answerCbQuery();
  await ctx.deleteMessage();

  if (action === "get" && !pipeline) {
    await ctx.sendChatAction("typing");
    const { data, msg, error } = await HawkApi.get("/source/" + source);
    if (error) throw error;

    const message = getSourcesMessage(msg, data);

    await ctx.reply(message);
    return;
  }

  const cleanAction = action === "get_pip" ? "get" : action;
  ctx.session.source_action = `${source}:${cleanAction}`;
  await sharedSelectPipelineCb_(ctx);
}

async function getPipelineSourceCb_(ctx: Context, source: Source, pipeline: string) {
  await ctx.sendChatAction("typing");
  const { data, msg, error } = await HawkApi.get(`/source?source=${source}&pipeline=${pipeline}`);
  if (error) throw error;

  const message = getSourcesMessage(msg, data);

  await ctx.reply(message);
}

async function addPipelineSourceCb_(ctx: Context, source: Source) {
  const { message_id } = await ctx.reply(
    fmt`${bold(
      `Please enter the ${
        source === "rss"
          ? "feed URL"
          : source === "x"
          ? "X username"
          : source === "telegram"
          ? "Channel username"
          : "Channel ID"
      }`
    )}`,
    {
      reply_markup: { force_reply: true },
    }
  );
  ctx.session.state = "source_action";
  ctx.session.toDelete.push(message_id);
}

async function removePipelineSourceCb_(ctx: Context, source: Source, pipeline: string) {
  await ctx.sendChatAction("typing");
  const { data, msg, error } = await HawkApi.get(`/source?source=${source}&pipeline=${pipeline}`);
  if (error) throw error;
  if (!msg || !data) throw new Error("API response is malformed!");

  const sources = (source === "telegram" || source === "tg_bot") && data ? await getChannelNames(data, ctx) : data;

  const { keyboard } = buildPaginatedKeyboard({
    items: data,
    page: 0,
    makeLabel: (value, i) => sources[i] ?? value,
    makeCallback: (value) => `rem_src:${source}:${value}`,
    navPrefix: `rem_src:${source}`,
  });

  cache.set("removePipelineSourceCb_sources", JSON.stringify(sources));
  cache.set("removePipelineSourceCb_data", JSON.stringify(data));

  // const keyboard = data.slice(0, 2).map((value, i) => [
  //   {
  //     text: sources[i] ?? value,
  //     callback_data: `rem_src:${source}:${value}`,
  //   },
  // ]);
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
    const _sources = cache.get(`removePipelineSourceCb_sources`);
    const _data = cache.get(`removePipelineSourceCb_data`);

    if (!_sources || !_data) throw new Error("This keyboard is stale. Please call the command again");
    const sources: string[] = JSON.parse(_sources);
    const data: string[] = JSON.parse(_data);

    const { keyboard } = buildPaginatedKeyboard({
      items: data,
      page: Number(page),
      makeLabel: (val, i) => sources[i] ?? val,
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

export {
  sourceSelectedCb,
  removePipelineSourceCb,
  addPipelineSourceCb_,
  getPipelineSourceCb_,
  removePipelineSourceCb_,
};
