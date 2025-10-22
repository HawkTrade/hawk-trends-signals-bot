import type { MiddlewareFn } from "telegraf";
import type { Context } from "../models/telegraf.model";
import type { HawkApiResponse } from "../models/twitter.api";
import { HawkApi } from "./fetch";
import { to_delete } from ".";
import cache from "../db/cache";

function errorWrapper(handler: MiddlewareFn<Context>): MiddlewareFn<Context> {
  const functionName = handler.name || "anonymousHandler";

  return async (ctx, next) => {
    try {
      const originalAnswerCbQuery = ctx.answerCbQuery.bind(ctx);
      ctx._cbAnswered = false;

      ctx.answerCbQuery = async (
        ...args: Parameters<typeof ctx.answerCbQuery>
      ) => {
        ctx._cbAnswered = true;
        return await originalAnswerCbQuery(...args);
      };

      await handler(ctx, next);
    } catch (error) {
      console.error(`${functionName} error:`, error);
      const message = error instanceof Error ? error.message : String(error);

      const error_message = `⚠️ ${message}`;
      if ("callbackQuery" in ctx && ctx.callbackQuery && !ctx._cbAnswered) {
        await ctx.answerCbQuery(error_message, { show_alert: true });
      } else {
        const { message_id } = await ctx.reply(error_message);
        ctx.session.toDelete.push(message_id);
      }
    }
  };
}

function groupOrSuperGroupChecker(ctx: Context) {
  if (!ctx.chat) throw new Error("You seem to be in the wrong context");

  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup")
    throw new Error(
      "This command is only executable in a group or super group, to ensure everyone sees the action being taken"
    );

  return ctx.chat.id.toString();
}

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
async function getAdmins() {
  const admins = cache.get("admins");
  if (admins) {
    return admins.split(",").map((a) => Number(a));
  }
  const { data } = await HawkApi.get<HawkApiResponse<number[]>>("/admin");
  if (!data) return [];

  cache.set("admins", data.join(","), { ttl: ONE_WEEK });
  return data;
}

async function validateCallerIsAdmin(ctx: Context) {
  if (!ctx.from) return null;
  const fromId = ctx.from.id;

  const [admins] = await Promise.all([getAdmins(), to_delete(ctx)]);
  const isAdmin = admins.includes(fromId);
  if (!isAdmin) {
    throw new Error("This is an admin only command");
  }
}

export { groupOrSuperGroupChecker, validateCallerIsAdmin, errorWrapper };
