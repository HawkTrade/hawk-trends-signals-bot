import fp from "fastify-plugin";
import { session, Telegraf } from "telegraf";
import { getDefaultSession } from "../utils";
import store from "../db/sqlite3";
import type { FastifyInstance } from "fastify";
import type { Context } from "../models/telegraf.model";
import { helpCmd, startCmd } from "../commands/start.command";
import botCommands from "../commands/commands";
import {
  addSourceHandler,
  getSourceHandler,
  removeSourceHandler,
} from "../_handlers/source.command";
// import {
//   selectSourceCallback,
//   sourceCallback,
//   selectPipelineCallback,
// } from "../_handlers/source.callback";
// import {
//   addRegexHandler,
//   getPromptsHandler,
//   getRegexHandler,
//   removeRegexHandler,
//   setPromptHandler,
import {
  getAdminHandler,
  removeAdminHandler,
  addAdminHandler,
} from "../commands/admin.command";
import {
  createPipelineCmd,
  cancelPipelineCmd,
  removePipelineCmd,
  getPipelineCmd,
} from "../commands/pipeline.command";
// import {
//   parserCallback,
//   removeRegexCallback,
//   removeAdminCallback,
//   removePipelineCallback,
// } from "../_handlers/parser.callback";
// import type { Update } from "telegraf/typings/core/types/typegram";
import { createPipelineMsg } from "../handlers/pipeline.handler";
import {
  createPipelineCb,
  getPipelineCb,
  removePipelineCb,
} from "../callbacks/pipeline.callback";

async function init(fastify: FastifyInstance) {
  const { BOT_TOKEN } = fastify.config;

  await fastify.register(
    fp<{ token: string; store: typeof store }>(
      async (fastify, opts) => {
        fastify.log.debug("Registering bot..");

        const bot = new Telegraf<Context>(opts.token);

        bot.use(
          session({
            defaultSession: getDefaultSession,
            store,
          })
        );

        bot.start(startCmd);
        bot.command("help", helpCmd);

        /* Source Management Section */
        bot.command("add_source", addSourceHandler);
        bot.command("remove_source", removeSourceHandler);
        bot.command("get_sources", getSourceHandler);
        bot.command("get_source", getSourceHandler); //

        // bot.command("add_regex", addRegexHandler);
        // bot.command("remove_regex", removeRegexHandler);
        // bot.command("get_regex", getRegexHandler);

        // bot.command("set_prompt", setPromptHandler);
        // bot.command("get_prompts", getPromptsHandler);

        /* Admin Manager Section */
        bot.command("add_admin", addAdminHandler);
        bot.command("remove_admin", removeAdminHandler);
        bot.command("get_admins", getAdminHandler);

        /* Pipelines Section */
        bot.command("create_pipeline", createPipelineCmd);
        bot.command("cancel_pipeline_creation", cancelPipelineCmd);
        bot.command("get_pipelines", getPipelineCmd);
        bot.command("remove_pipeline", removePipelineCmd);

        bot.action(/^(pipeline_create):(confirm|cancel)$/, createPipelineCb);
        bot.action(/^(remove_pipeline):(.+)$/, removePipelineCb);
        bot.action(/^(get_pipeline):(.+)$/, getPipelineCb);

        // bot.action(
        //   /^(telegram|x|rss|tg_bot|discord):(add|rem|get)$/,
        //   selectSourceCallback
        // );
        // bot.action(/^(pipeline_select):(.+)$/, selectPipelineCallback);
        // bot.action(/^(regex_remove):(.+)$/, removeRegexCallback);
        // bot.action(/^(pipeline_remove):(.+)$/, removePipelineCallback);

        bot.on("message", async (ctx, next) => {
          const { state } = ctx.session;
          // if (state === "source_action") await sourceCallback(ctx);
          // else if (state === "parser_action") await parserCallback(ctx);
          if (state === "pipeline_create") await createPipelineMsg(ctx, next);
          return await next();
        });

        bot.context.fastify = fastify;

        bot.launch(() => console.log("Bot is running..."));
        // const webhookPath = "/telegram";
        // const webhookUrl = `${WEBHOOK_URL}${webhookPath}`;

        // await bot.telegram.setWebhook(webhookUrl);

        await bot.telegram.deleteMyCommands();
        await Promise.all([
          bot.telegram.setMyCommands(botCommands, {
            scope: { type: "default" },
          }),
          bot.telegram.setMyCommands(botCommands, {
            scope: { type: "all_private_chats" },
          }),
          bot.telegram.setMyCommands(botCommands, {
            scope: { type: "all_group_chats" },
          }),
          bot.telegram.setMyCommands(botCommands, {
            scope: { type: "all_chat_administrators" },
          }),
        ]);

        // fastify.post(webhookPath, async (request, reply) => {
        //   await bot.handleUpdate(request.body as Update);
        //   return reply.send({ ok: true });
        // });

        fastify.decorate("bot", bot);
      },
      {
        name: "hawk-trends-and-signals-bot",
      }
    ),
    {
      token: BOT_TOKEN,
      store,
    }
  );

  return fastify;
}

declare module "fastify" {
  interface FastifyInstance {
    bot: Telegraf<Context>;
  }
}

export default init;
