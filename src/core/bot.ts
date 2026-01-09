import fp from "fastify-plugin";
import { session, Telegraf } from "telegraf";
import { getDefaultSession } from "../utils";
import store from "../db/sqlite3";
import type { FastifyInstance } from "fastify";
import type { Context } from "../models/telegraf.model";
import { helpCmd, startCmd } from "../commands/start.command";
import botCommands from "../commands/commands";
import {
  addSourceCmd,
  removeSourceCmd,
  getSourcesCmd,
  getSourcesForPipelineCmd,
  pingCmd,
  pollCmd,
} from "../commands/source.command";
import {
  getAdminsCmd,
  removeAdminCmd,
  addAdminCmd,
} from "../commands/admin.command";
import {
  createPipelineCmd,
  cancelPipelineCmd,
  removePipelineCmd,
  getPipelinesCmd,
  editPipelineCmd,
} from "../commands/pipeline.command";
import type { Update } from "telegraf/typings/core/types/typegram";
import {
  createPipelineMsg,
  editPipelineMsg,
} from "../handlers/pipeline.handler";
import {
  createPipelineCb,
  getPipelineCb,
  removePipelineCb,
  editPipelineCb,
} from "../callbacks/pipeline.callback";
import { removeAdminCb } from "../callbacks/admin.callback";
import {
  removePipelineSourceCb,
  sourceSelectedCb,
} from "../callbacks/source.callback";
import { addParserMsg, addSourceMsg } from "../handlers/general.handler";
import { selectedPipelineCb } from "../callbacks/shared_pipeline.callback";
import {
  addRegexCmd,
  getPromptCmd,
  getRegexesCmd,
  removeRegexCmd,
  setPromptCmd,
} from "../commands/parser.command";
import { removePipelineRegexCb } from "../callbacks/parser.callback";
import { addWebSelectorCmd, testWebSourceCmd } from "../commands/web.command";
import {
  webConfirmCb,
  webPipelineCb,
  webSourceSelectedCb,
  webTestConfirmCb,
} from "../callbacks/web.callback";
import { addWebSelectorMsg } from "../handlers/web.handler";

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

        /* Source Management Section */
        bot.command("add_source", addSourceCmd);
        bot.command("remove_source", removeSourceCmd);
        bot.command("get_sources", getSourcesCmd);
        bot.command("get_pipeline_sources", getSourcesForPipelineCmd);
        bot.command("ping", pingCmd);
        bot.command("poll", pollCmd);

        bot.action(
          /^(telegram|x|rss|tg_bot|discord|web):(add|rem|get|get_pip|ping)$/,
          sourceSelectedCb
        );
        bot.action(/^(rem_src):(.+)$/, removePipelineSourceCb);
        bot.action(/^(rem_rgx):(.+)$/, removePipelineRegexCb);

        /* Parser Management Section */
        bot.command("add_regex", addRegexCmd);
        bot.command("remove_regex", removeRegexCmd);
        bot.command("get_regexes", getRegexesCmd);
        bot.command("set_prompt", setPromptCmd);
        bot.command("get_prompts", getPromptCmd);

        /* Admin Manager Section */
        bot.command("add_admin", addAdminCmd);
        bot.command("remove_admin", removeAdminCmd);
        bot.command("get_admins", getAdminsCmd);

        bot.action(/^(admin_remove):(.+)$/, removeAdminCb);

        /* Pipelines Management Section */
        bot.command("create_pipeline", createPipelineCmd);
        bot.command("cancel_pipeline_creation", cancelPipelineCmd);
        bot.command("get_pipelines", getPipelinesCmd);
        bot.command("edit_pipeline_tp_sl", editPipelineCmd);
        bot.command("remove_pipeline", removePipelineCmd);

        bot.action(/^(pipeline_create):(confirm|cancel)$/, createPipelineCb);
        bot.action(/^(remove_pipeline):(.+)$/, removePipelineCb);
        bot.action(/^(get_pipeline):(.+)$/, getPipelineCb);
        bot.action(/^(edit_pipeline):(.+)$/, editPipelineCb);
        bot.action(/^(selected_pipeline):(.+)$/, selectedPipelineCb); // Shared across parsers and sources

        /* Web Selector Section */
        bot.command("add_web_selectors", addWebSelectorCmd);
        bot.command("test_web_source", testWebSourceCmd);

        bot.action(/^(web_pipeline):(.+)$/, webPipelineCb);
        bot.action(/^(web_src):(.+)$/, webSourceSelectedCb);
        bot.action(/^(web_confirm):(yes|no)$/, webConfirmCb);
        bot.action(/^(web_confirm_test):(yes|no)$/, webTestConfirmCb);

        bot.on("message", async (ctx, next) => {
          const { state } = ctx.session;
          switch (state) {
            case "source_action":
              await addSourceMsg(ctx, next);
              break;
            case "parser_action":
              await addParserMsg(ctx, next);
              break;
            case "pipeline_create":
              await createPipelineMsg(ctx, next);
              break;
            case "pipeline_edit":
              await editPipelineMsg(ctx, next);
              break;
            case "web_selector":
            case "web_test":
              await addWebSelectorMsg(ctx, next);
              break;

            default:
              break;
          }
          return await next();
        });

        bot.context.fastify = fastify;

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

        const isProd = process.env.NODE_ENV === "production";

        if (isProd) {
          const webhookPath = "/telegram";
          const webhookUrl = `${WEBHOOK_URL}${webhookPath}`;

          await bot.telegram.setWebhook(webhookUrl);

          fastify.post(webhookPath, async (request, reply) => {
            await bot.handleUpdate(request.body as Update);
            return reply.send({ ok: true });
          });
        } else {
          fastify.log.info("Starting in POLLING mode...");

          await bot.telegram.deleteWebhook();
          bot.launch(() => console.log("Bot is running..."));

          process.once("SIGINT", () => bot.stop("SIGINT"));
          process.once("SIGTERM", () => bot.stop("SIGTERM"));
        }

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
