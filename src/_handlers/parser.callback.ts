// import type { Context, Parser } from "../models/telegraf.model";
// import type { HawkSignalsAndTrendsAPIResponse as Res } from "../models/twitter.api";
// import { HawkSignalsAndTrendsAPI as HSTAPI } from "../utils/fetch";

// async function parserCallback(ctx: Context) {
//   if (!ctx.message || !("text" in ctx.message)) return;
//   const { state, pipeline } = ctx.session;
//   if (state !== "parser_action" || !pipeline) return;
//   if (
//     !ctx.message.reply_to_message ||
//     ctx.message.reply_to_message?.from?.id !== ctx.botInfo.id ||
//     !ctx.from?.id
//   )
//     return;

//   if ("text" in ctx.message.reply_to_message) {
//     const text = ctx.message.text;
//     const [parser] = ctx.session.parser_action!.split(":") as [Parser];
//     try {
//       if (parser === "regex") {
//         const { msg, error } = await HSTAPI.post<Res>("/regex", {
//           pattern: text,
//           pipeline,
//         });
//         await ctx.reply(msg || error || "Shouldn't happen!");
//       } else if (parser === "llm") {
//         const res = await HSTAPI.post<Res>("/prompt", {
//           prompt: text,
//           pipeline,
//         });
//         await ctx.reply(res.msg || res.error || "Shouldn't happen!");
//       } else if (parser === "admin") {
//
//         await ctx.reply(res.msg || res.error || "Shouldn't happen!");
//       } else if (parser === "pipeline") {
//         const res = await HSTAPI.post<Res>("/pipeline", {
//           pipeline,
//           strategyId: text,
//         });
//         await ctx.reply(res.msg || res.error || "Shouldn't happen!");
//       }
//     } catch (error) {
//       console.error(`Error in parser (${parser}) callback`, error);
//       if (error instanceof Error) {
//         return ctx.reply(error.message);
//       }
//       await ctx.reply("An error occurred. Please try again later.");
//     } finally {
//       ctx.session.state = "idle";
//       ctx.session.parser_action = null;
//     }
//   }
// }

// async function removeRegexCallback(ctx: Context) {
//   if (
//     !ctx.callbackQuery ||
//     !("data" in ctx.callbackQuery) ||
//     !ctx.callbackQuery.data
//   )
//     return;

//   try {
//     const [, encoded] = ctx.callbackQuery.data.split(":");
//     const pipeline = ctx.session.pipeline;

//     if (!encoded || !pipeline) return;
//     const pattern = decodeURIComponent(encoded);

//     // await ctx.answerCbQuery();
//     // await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
//     await ctx.answerCbQuery();
//     await ctx.deleteMessage();

//     const { error, msg } = await HSTAPI.delete<Res>("/regex", {
//       pattern,
//       pipeline,
//     });
//     await ctx.reply(msg || error || "Shouldn't happen!");
//   } catch (error) {
//     console.error(error);
//     await ctx.answerCbQuery("An error occurred.");
//   }
// }
