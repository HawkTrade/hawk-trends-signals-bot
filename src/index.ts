import Fastify from "fastify";
import { bot, config } from "./core";
import { asyncPipe } from "./utils";

const fastify = Fastify({
  logger: {
    level: "debug",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  },
});

const start = async () => {
  try {
    await asyncPipe(config, bot)(fastify);
    const { PORT } = fastify.config;

    await fastify.listen({ port: PORT, host: "0.0.0.0" });

    process.once("SIGINT", () => {
      fastify.close();
      // fastify.bot.stop("SIGINT");
    });
    process.once("SIGTERM", () => {
      fastify.close();
      // fastify.bot.stop("SIGTERM");
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
