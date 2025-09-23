import type {
  FilterRuleCreateResponse,
  FilterRules,
  FilterRuleUpdateRequest,
  TwitterApiResponse,
} from "../models/twitter.api";
import { TwitterApi } from "../utils/fetch";

const DEFAULT_INTERVAL = 60;

async function addTweetFilterRule(usernames: string[], ruleTag?: string, intervalSec?: number) {
  const tag = ruleTag ?? "filter tweets for " + usernames.join(", ");
  const interval_seconds = intervalSec ?? DEFAULT_INTERVAL;
  const value = usernames.length === 1 ? `@${usernames[0]}` : usernames.map((u) => `from:${u}`).join(" OR ");

  const endpoint = "/oapi/tweet_filter/add_rule";
  const body = { tag, value, interval_seconds };

  try {
    const res = await TwitterApi.post<FilterRuleCreateResponse>(endpoint, body);

    return { ...res, ...body };
  } catch (error) {
    throw error;
  }
}

async function activateTweetFilterRule(rule: FilterRuleUpdateRequest) {
  const endpoint = `/oapi/tweet_filter/update_rule`;
  const body = { ...rule, is_effect: 1 };
  try {
    return TwitterApi.post<TwitterApiResponse>(endpoint, body);
  } catch (error) {
    throw error;
  }
}

async function removeTweetFilterRule(id: string) {
  const endpoint = "/oapi/tweet_filter/delete_rule";
  const body = { rule_id: id };

  try {
    const { status, msg } = await TwitterApi.delete<TwitterApiResponse>(endpoint, body);

    if (status === "error") {
      throw new Error(`Error removing Tweet filter rule: ${msg}`);
    }
  } catch (error) {
    throw error;
  }
}

async function getTweetFilterRules() {
  const endpoint = "/oapi/tweet_filter/get_rules";
  try {
    const { rules, msg, status } = await TwitterApi.get<FilterRules>(endpoint);

    if (status === "success") {
      return rules;
    } else {
      throw new Error(`Error fetching Tweet filter rules: ${msg}`);
    }
  } catch (error) {
    throw error;
  }
}

async function addRuleAndActivate(usernames: string[], ruleTag?: string, intervalSec?: number) {
  const { status, msg, ...rule } = await addTweetFilterRule(usernames, ruleTag, intervalSec);

  if (status === "error") {
    throw new Error(`Error creating a Tweet filter rule: ${msg}`);
  }

  const response = await activateTweetFilterRule(rule);

  if (response.status === "error") {
    throw new Error(`Error activating a Tweet filter rule: ${response.msg}`);
  }
}

async function addUserToMonitorTweets(username: string) {
  const endpoint = "/oapi/x_user_stream/add_user_to_monitor_tweet";
  const body = { x_user_name: username };

  try {
    const res = await TwitterApi.post<TwitterApiResponse>(endpoint, body);
    return res;
  } catch (error) {
    throw error;
  }
}

export { addRuleAndActivate, removeTweetFilterRule, getTweetFilterRules, addUserToMonitorTweets };
