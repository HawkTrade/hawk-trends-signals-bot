import type { Context } from "../models/telegraf.model";
import { adminCheck } from "../utils/utils";

const cmd = "Please select the source";
const keyboards = (action: "add" | "rem" | "get") => {
  return [
    [
      { text: "Gram", callback_data: `telegram:${action}` },
      { text: "X", callback_data: `x:${action}` },
      { text: "RSS", callback_data: `rss:${action}` },
    ],
    [
      { text: "TG Bot", callback_data: `tg_bot:${action}` },
      { text: "Discord", callback_data: `discord:${action}` },
    ],
  ];
};

async function addSourceHandler(ctx: Context) {
  try {
    await adminCheck(ctx);

    await ctx.reply(cmd, {
      reply_markup: {
        inline_keyboard: keyboards("add"),
      },
    });
  } catch (error) {
    console.error(error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function removeSourceHandler(ctx: Context) {
  try {
    await adminCheck(ctx);

    await ctx.reply(cmd, {
      reply_markup: {
        inline_keyboard: keyboards("rem"),
      },
    });
  } catch (error) {
    console.error(error);
    await ctx.reply("An error occurred. Please try again later.");
  }
}

async function getSourceHandler(ctx: Context) {
  try {
    await ctx.reply(cmd, {
      reply_markup: {
        inline_keyboard: keyboards("get"),
      },
    });
  } catch (error) {
    console.error(error);

    await ctx.reply("An error occurred. Please try again later.");
  }
}

export { addSourceHandler, removeSourceHandler, getSourceHandler };
