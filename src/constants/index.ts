import { getEnv } from "../utils";

const TG_CHANNEL = Number(getEnv("TG_CHANNEL"));
const BOT_TOKEN = getEnv("BOT_TOKEN");

const ADMIN_IDS_STRING = getEnv("ADMIN_IDS");
const ADMIN_IDS = ADMIN_IDS_STRING.split(",").map((id) => Number(id));

const BASE_TWITTER_API = "https://api.twitterapi.io";
const TWITTER_API_KEY = getEnv("TWITTER_API_KEY");
const TWITTER_ACCOUNTS_ENDPOINT = "https://explorer-api.mobula.io/api/1/all?fields=twitter,market_cap";

export { TG_CHANNEL, BOT_TOKEN, ADMIN_IDS, BASE_TWITTER_API, TWITTER_ACCOUNTS_ENDPOINT, TWITTER_API_KEY };
