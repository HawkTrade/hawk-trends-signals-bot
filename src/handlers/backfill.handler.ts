import * as v from "valibot";
import { Context } from "../models/telegraf.model";
import { errorWrapper, groupOrSuperGroupChecker } from "../utils/helpers";
import cache from "../db/cache";
import { BackfillJob } from "../models/db.model";
import { HawkApi } from "../utils/fetch";
import { bold, fmt } from "telegraf/format";

const DateSchema = v.pipe(
  v.string(),
  v.transform((val) => new Date(val)),
  v.check((val) => !isNaN(val.getTime()), "Invalid date format"),
);

const BackfillCountSchema = v.pipe(v.number(), v.minValue(1), v.maxValue(1000));

function getNextStep(data: Partial<BackfillJob>) {
  if (data.type === "count") {
    if (data.count === undefined) return "count";
  } else if (data.type === "date") {
    if (data.start === undefined) return "start";
    if (data.end === undefined) return "end";
  }
  return null;
}

async function _backfillMsgHandler(ctx: Context) {
  if (!ctx.message || !("text" in ctx.message))
    throw new Error("No message was provided");

  const text = ctx.message.text.trim();
  const key = groupOrSuperGroupChecker(ctx);

  if (!cache.has(key))
    throw new Error("Backfill session expired! Please restart with /backfill");

  const partial: BackfillJob = JSON.parse(cache.get(key) || "{}");
  const currentStep = getNextStep(partial);

  if (!currentStep) {
    throw new Error("Invalid backfill state");
  }

  switch (currentStep) {
    case "count":
      const count = parseInt(text);
      const countResult = v.safeParse(BackfillCountSchema, count);
      if (!countResult.success) {
        throw new Error("Please enter a valid number between 1 and 1000");
      }
      partial.count = countResult.output;
      break;

    case "start":
      const startResult = v.safeParse(DateSchema, text);
      if (!startResult.success) {
        throw new Error("Please enter a valid start date (e.g. 2026-01-01)");
      }
      partial.start = new Date(text);
      await ctx.reply(fmt`${bold("Enter the end date (e.g. 2026-01-02):")}`);
      cache.set(key, JSON.stringify(partial));
      ctx.session.toDelete.push(ctx.message.message_id);
      return;

    case "end":
      const endResult = v.safeParse(DateSchema, text);
      if (!endResult.success) {
        throw new Error("Please enter a valid end date (e.g. 2026-01-02)");
      }
      partial.end = new Date(text);
      break;
  }

  await ctx.sendChatAction("typing");
  const { sourceType, ...rest } = partial;

  const body: Omit<BackfillJob, "sourceType"> = {
    ...rest,
  };

  if (partial.type === "count") {
    body.count = partial.count!;
  } else {
    body.start = partial.start!;
    body.end = partial.end!;
  }

  const { error, msg } = await HawkApi.post(
    `/request-backfill/${sourceType}`,
    body,
  );
  if (error) throw error;

  cache.delete(key);
  ctx.session.state = "idle";
  await ctx.reply(msg || "Backfill requested successfully!");

  ctx.session.toDelete.push(ctx.message.message_id);
}

export const backfillMsgHandler = errorWrapper(_backfillMsgHandler);
