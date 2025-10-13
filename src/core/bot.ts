import fp from "fastify-plugin";
import { session, Telegraf } from "telegraf";
import { getDefaultSession } from "../utils";
import store from "../db/sqlite3";
import type { FastifyInstance } from "fastify";
import type { Context } from "../models/telegraf.model";
import { helpCmd, startCmd } from "../handlers/start.command";
import botCommands from "../handlers/commands";
import {
  addSourceHandler,
  getSourceHandler,
  removeSourceHandler,
} from "../handlers/source.command";
import {
  selectSourceCallback,
  sourceCallback,
} from "../handlers/source.callback";
import {
  addRegexHandler,
  addWebhookHandler,
  getPromptsHandler,
  getRegexHandler,
  getWebhookHandler,
  removeRegexHandler,
  removeWebhookHandler,
  setPromptHandler,
  getAdminHandler,
  removeAdminHandler,
  addAdminHandler,
} from "../handlers/parser.command";
import {
  createPipelineHandler,
  removePipelineHandler,
  getPipelinesHandler,
  setActivePipelineHandler,
  getActivePipelineHandler,
} from "../handlers/pipeline.command";
import {
  parserCallback,
  removeRegexCallback,
  removeWebhookCallback,
  removeAdminCallback,
  removePipelineCallback,
  setPipelineCallback,
} from "../handlers/parser.callback";
import type { Update } from "telegraf/typings/core/types/typegram";

async function init(fastify: FastifyInstance) {
  const { BOT_TOKEN, WEBHOOK_URL } = fastify.config;

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

        bot.command("add_source", addSourceHandler);
        bot.command("remove_source", removeSourceHandler);
        bot.command("get_sources", getSourceHandler);

        bot.command("add_regex", addRegexHandler);
        bot.command("remove_regex", removeRegexHandler);
        bot.command("get_regex", getRegexHandler);

        bot.command("set_prompt", setPromptHandler);
        bot.command("get_prompts", getPromptsHandler);

        bot.command("add_webhook", addWebhookHandler);
        bot.command("remove_webhook", removeWebhookHandler);
        bot.command("get_webhooks", getWebhookHandler);

        bot.command("add_admin", addAdminHandler);
        bot.command("remove_admin", removeAdminHandler);
        bot.command("get_admins", getAdminHandler);

        bot.command("create_pipeline", createPipelineHandler);
        bot.command("remove_pipeline", removePipelineHandler);
        bot.command("get_pipelines", getPipelinesHandler);
        bot.command("set_active_pipeline", setActivePipelineHandler);
        bot.command("get_active_pipeline", getActivePipelineHandler);

        bot.action(
          /^(telegram|x|rss|tg_bot|discord):(add|rem|get)$/,
          selectSourceCallback
        ); //
        bot.action(/^(regex_remove):(.+)$/, removeRegexCallback);
        bot.action(/^(webhook_remove):(.+)$/, removeWebhookCallback);
        bot.action(/^(admin_remove):(.+)$/, removeAdminCallback);
        bot.action(/^(pipeline_remove):(.+)$/, removePipelineCallback);
        bot.action(/^(pipeline_set):(.+)$/, setPipelineCallback);

        bot.on("message", async (ctx, next) => {
          const { state } = ctx.session;
          if (state === "source_action") await sourceCallback(ctx);
          else if (state === "parser_action") await parserCallback(ctx);
          return await next();
        });

        bot.context.fastify = fastify;

        // bot.launch(() => console.log("Bot is running..."));
        const webhookPath = "/telegram";
        const webhookUrl = `${WEBHOOK_URL}${webhookPath}`;

        await bot.telegram.setWebhook(webhookUrl);

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

        fastify.post(webhookPath, async (request, reply) => {
          await bot.handleUpdate(request.body as Update);
          return reply.send({ ok: true });
        });

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
