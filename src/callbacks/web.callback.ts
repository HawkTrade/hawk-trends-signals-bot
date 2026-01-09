import { Context } from "../models/telegraf.model";
import { errorWrapper } from "../utils/helpers";
import { HawkApi } from "../utils/fetch";
import type { DataSource, HawkApiResponse } from "../models/twitter.api";
import { buildPaginatedKeyboard } from "../keyboards/shared.keyboards";
import cache from "../db/cache";
import { containerMsg, testResultMsg } from "../messages/web.messages";
import { WebData } from "../models/db.model";

async function _webPipelineCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback");

  const [, pipeline] = ctx.callbackQuery.data.split(":");
  if (!pipeline) throw new Error("No pipeline found in callback");

  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  await ctx.sendChatAction("typing");

  const { data, msg, error } = await HawkApi.get<HawkApiResponse<DataSource>>(
    `/source?source=web&pipeline=${pipeline}`
  );
  if (error) throw error;
  if (!data) throw new Error("No web sources found for this pipeline");

  ctx.session.pipeline = pipeline;
  cache.set(`web_sources:${pipeline}`, JSON.stringify(data));

  const { keyboard } = buildPaginatedKeyboard({
    data,
    page: 0,
    makeCallback: (url) => `web_src:${url}`,
    navPrefix: `web_src`,
  });

  await ctx.reply(msg + "\nSelect a web source to add selectors for:", {
    reply_markup: { inline_keyboard: keyboard },
  });
}

async function _webSourceSelectedCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback");

  const [, value, page] = ctx.callbackQuery.data.split(":");
  const pipeline = ctx.session.pipeline;

  if (value === "page") {
    const cached = cache.get(`web_sources:${pipeline}`);
    if (!cached) throw new Error("Session expired. Please start over.");

    const data: DataSource = JSON.parse(cached);
    const { keyboard } = buildPaginatedKeyboard({
      data,
      page: Number(page),
      makeCallback: (url) => `web_src:${url}`,
      navPrefix: `web_src`,
    });

    await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard });
    return ctx.answerCbQuery();
  }

  const sourceUrl = value;
  await ctx.answerCbQuery();
  await ctx.deleteMessage();

  ctx.session.state = "web_selector";
  cache.set(
    `web_selector_context:${ctx.from?.id}`,
    JSON.stringify({ url: sourceUrl, selectors: {} })
  );

  const { message_id } = await ctx.reply(containerMsg);
  ctx.session.toDelete.push(message_id);
}

async function _webConfirmCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback");

  const [, action] = ctx.callbackQuery.data.split(":");
  const cacheKey = `web_selector_context:${ctx.from?.id}`;
  const cached = cache.get(cacheKey);

  if (!cached) throw new Error("Session expired. Please start over.");

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

  if (action === "no") {
    cache.delete(cacheKey);
    ctx.session.state = "idle";
    await ctx.answerCbQuery("Cancelled");
    await ctx.reply("Web selector addition cancelled.");
    return;
  }

  const { url, selectors } = JSON.parse(cached);
  await ctx.sendChatAction("typing");

  const { error, msg } = await HawkApi.post("/source/web/selectors", {
    url,
    selectors,
  });

  if (error) throw error;

  await ctx.answerCbQuery(msg || "Selectors added successfully!");
  await ctx.reply(msg || "Selectors added successfully!");

  cache.delete(cacheKey);
  ctx.session.state = "idle";
}

async function _webTestConfirmCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("No data in the callback");

  const [, action] = ctx.callbackQuery.data.split(":");
  const cacheKey = `web_selector_context:${ctx.from?.id}`;
  const cached = cache.get(cacheKey);

  if (!cached) throw new Error("Session expired. Please start over.");

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

  if (action === "no") {
    cache.delete(cacheKey);
    ctx.session.state = "idle";
    await ctx.answerCbQuery("Cancelled");
    await ctx.reply("Web source testing cancelled.");
    return;
  }

  const { url, selectors } = JSON.parse(cached);
  await ctx.sendChatAction("typing");

  const { error, msg, data } = await HawkApi.post<HawkApiResponse<WebData[]>>(
    "/source/web/test",
    {
      url,
      selectors,
    }
  );

  if (error) throw error;

  await ctx.answerCbQuery(msg || "Test completed!");

  if (data && Array.isArray(data)) {
    const message = testResultMsg(msg || "Test Results:", data);
    await ctx.reply(message);
  } else {
    await ctx.reply(msg || "Test completed but no data was returned.");
  }

  cache.delete(cacheKey);
  ctx.session.state = "idle";
}

const webPipelineCb = errorWrapper(_webPipelineCb);
const webSourceSelectedCb = errorWrapper(_webSourceSelectedCb);
const webConfirmCb = errorWrapper(_webConfirmCb);
const webTestConfirmCb = errorWrapper(_webTestConfirmCb);

export { webPipelineCb, webSourceSelectedCb, webConfirmCb, webTestConfirmCb };
