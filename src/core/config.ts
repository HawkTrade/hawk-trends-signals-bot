import fastifyEnv from "@fastify/env";
import type { FastifyInstance } from "fastify";

const schema = {
  type: "object",
  required: ["BOT_TOKEN", "TG_CHANNEL"],
  properties: {
    BOT_TOKEN: { type: "string", default: "" },
    TG_CHANNEL: { type: "string", default: "" },
    NODE_ENV: { type: "string", default: "development" },
    WEBHOOK_URL: { type: "string", default: "" },
    PORT: { type: "number", default: 3000 },
  },
};

const options = {
  schema,
  dotenv: true,
};

type BuildSchema<
  T extends {
    properties: { [key: string]: { type: string; default: unknown } };
  }
> = {
  [K in keyof T["properties"]]: T["properties"][K]["default"];
};

export type Schema = BuildSchema<typeof schema>;

async function init(fastify: FastifyInstance) {
  fastify.log.debug("Registering config..");

  await fastify.register(fastifyEnv, options);

  fastify.log.debug(fastify.config, "Registered with config");

  return fastify;
}

declare module "fastify" {
  interface FastifyInstance {
    config: Schema;
    getEnvs(): Schema;
  }
}

export default init;
