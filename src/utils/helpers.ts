import type { MiddlewareFn } from "telegraf";
import type { Context } from "../models/telegraf.model";

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

export { groupOrSuperGroupChecker, errorWrapper };
