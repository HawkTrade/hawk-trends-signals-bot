import { Context } from "../models/telegraf.model";
import { WebScraperParams } from "../models/db.model";
import { errorWrapper } from "../utils/helpers";
import cache from "../db/cache";
import {
  titleMsg,
  urlMsg,
  contentMsg,
  webSelectorSummary,
} from "../messages/web.messages";

const WEB_SELECTOR_STEPS: (keyof WebScraperParams)[] = [
  "container",
  "title",
  "url",
  "content",
];

function getNextStep(data: Partial<WebScraperParams>) {
  return WEB_SELECTOR_STEPS.find(
    (key) => data[key] === undefined || data[key] === null
  );
}

async function _addWebSelectorMsg(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message))
    throw new Error("No message was provided");

  const text = ctx.message.text.trim();
  const cacheKey = `web_selector_context:${ctx.from?.id}`;
  const cached = cache.get(cacheKey);

  if (!cached) throw new Error("Selection session expired. Please start over.");

  const {
    url,
    selectors,
  }: { url: string; selectors: Partial<WebScraperParams> } = JSON.parse(cached);
  const currentStep = getNextStep(selectors);

  if (!currentStep) return;

  selectors[currentStep] = text;
  const nextStep = getNextStep(selectors);

  let replyId: number | undefined;

  switch (nextStep) {
    case "title":
      replyId = (await ctx.reply(titleMsg)).message_id;
      break;
    case "url":
      replyId = (await ctx.reply(urlMsg)).message_id;
      break;
    case "content":
      replyId = (await ctx.reply(contentMsg)).message_id;
      break;
    case undefined:
      const message = webSelectorSummary(url, selectors as WebScraperParams);
      replyId = (
        await ctx.reply(message, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Confirm", callback_data: "web_confirm:yes" },
                { text: "❌ Cancel", callback_data: "web_confirm:no" },
              ],
            ],
          },
        })
      ).message_id;
      break;
  }

  ctx.session.toDelete.push(ctx.message.message_id);
  if (replyId) ctx.session.toDelete.push(replyId);

  cache.set(cacheKey, JSON.stringify({ url, selectors }));
}

const addWebSelectorMsg = errorWrapper(_addWebSelectorMsg);

export { addWebSelectorMsg };
