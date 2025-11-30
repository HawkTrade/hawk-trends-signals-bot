import { getEnv } from "../utils";

const TG_CHANNEL = Number(getEnv("TG_CHANNEL"));
const BOT_TOKEN = getEnv("BOT_TOKEN");

const BASE_TWITTER_API = "https://api.twitterapi.io";
const TWITTER_API_KEY = getEnv("TWITTER_API_KEY");
const TWITTER_ACCOUNTS_ENDPOINT = "https://explorer-api.mobula.io/api/1/all?fields=twitter,market_cap";

export { TG_CHANNEL, BOT_TOKEN, BASE_TWITTER_API, TWITTER_ACCOUNTS_ENDPOINT, TWITTER_API_KEY };
