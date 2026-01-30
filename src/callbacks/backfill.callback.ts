import { Context, Source } from "../models/telegraf.model";
import { HawkApi } from "../utils/fetch";
import { errorWrapper } from "../utils/helpers";
import { buildPaginatedKeyboard } from "../keyboards/shared.keyboards";
import { DataSource, HawkApiResponse } from "../models/twitter.api";
import { bold, fmt, italic } from "telegraf/format";
import cache from "../db/cache";
import { BackfillJob } from "../models/db.model";
import { groupOrSuperGroupChecker } from "../utils/helpers";

async function _backfillSourceSelectedCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("Callback Query data is empty");

  const [_, source, value, page] = ctx.callbackQuery.data.split(":") as [
    string,
    Source,
    string | "page",
    string,
  ];

  const key = groupOrSuperGroupChecker(ctx);

  if (value === "page") {
    const _data = cache.get(`${key}_backfill_sources`);
    if (!_data) throw new Error("Session expired. Please restart /backfill");

    const data: DataSource = JSON.parse(_data);
    const { keyboard } = buildPaginatedKeyboard({
      data,
      page: Number(page),
      makeCallback: (val) => `backfill_src:${source}:${val}`,
      navPrefix: `backfill_src:${source}`,
    });

    await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard });
    return ctx.answerCbQuery();
  }

  await ctx.answerCbQuery();
  await ctx.deleteMessage();

  const partial: BackfillJob = JSON.parse(cache.get(key) || "{}");
  partial.source = value;
  cache.set(key, JSON.stringify(partial));

  await ctx.reply(fmt`${bold("Select backfill type:")}`, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Count", callback_data: "backfill_type:count" },
          { text: "Date Range", callback_data: "backfill_type:date" },
        ],
      ],
    },
  });
}

async function _backfillTypeSelectedCb(ctx: Context) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery))
    throw new Error("Callback Query data is empty");

  const [_, type] = ctx.callbackQuery.data.split(":") as [
    string,
    "count" | "date",
  ];
  await ctx.answerCbQuery();
  await ctx.deleteMessage();

  const key = groupOrSuperGroupChecker(ctx);
  const partial: BackfillJob = JSON.parse(cache.get(key) || "{}");
  partial.type = type;
  cache.set(key, JSON.stringify(partial));
  ctx.session.state = "backfill";

  if (type === "count") {
    await ctx.reply(
      fmt`${bold("Enter the number of items to backfill (1-1000):")}`,
    );
  } else {
    await ctx.reply(fmt`${bold("Enter the start date (e.g. 2026-01-01):")}`);
  }
}

async function selectBackfillSourceCb_(
  ctx: Context,
  source: Source,
  pipeline: string,
) {
  const key = groupOrSuperGroupChecker(ctx);
  await ctx.sendChatAction("typing");

  const { data, msg, error } = await HawkApi.get<HawkApiResponse<DataSource>>(
    `/source?source=${source}&pipeline=${pipeline}`,
  );
  if (error) throw error;
  if (!msg || !data) throw new Error("API response is malformed!");

  cache.set(`${key}_backfill_sources`, JSON.stringify(data));

  const job: Partial<BackfillJob> = {
    sourceType: source,
    pipeline,
    requestedBy: ctx.from?.id || 0,
  };
  cache.set(key, JSON.stringify(job));

  const { keyboard } = buildPaginatedKeyboard({
    data,
    page: 0,
    makeCallback: (value) => `backfill_src:${source}:${value}`,
    navPrefix: `backfill_src:${source}`,
  });

  const message = fmt`${bold(msg)}
  
${italic`Select the source to backfill`} 
  `;
  await ctx.reply(message, { reply_markup: { inline_keyboard: keyboard } });
}

export const backfillSourceSelectedCb = errorWrapper(_backfillSourceSelectedCb);
export const backfillTypeSelectedCb = errorWrapper(_backfillTypeSelectedCb);
export { selectBackfillSourceCb_ };
