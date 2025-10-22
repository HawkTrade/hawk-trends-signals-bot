import {
  BASE_TWITTER_API,
  BOT_TOKEN,
  TWITTER_ACCOUNTS_ENDPOINT,
  TWITTER_API_KEY,
} from "../constants";
import { HawkApiResponse } from "../models/twitter.api";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface FetchOptions {
  headers?: Record<string, string>;
  body?: object | undefined;
}

class CustomFetch<H = unknown> {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    method: HttpMethod,
    options: FetchOptions = {}
  ): Promise<T> {
    const url = this.baseUrl + endpoint;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      ...options.headers,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        data?.error || data?.msg || response.statusText || "Unknown error";
      throw new Error(message);
    }

    return data as T;
  }

  get<T = H>(endpoint: string, options?: FetchOptions) {
    return this.request<T>(endpoint, "GET", options);
  }

  post<T = H>(endpoint: string, body?: object, options?: FetchOptions) {
    return this.request<T>(endpoint, "POST", { ...options, body });
  }

  patch<T = H>(endpoint: string, body?: object, options?: FetchOptions) {
    return this.request<T>(endpoint, "PATCH", { ...options, body });
  }

  put<T = H>(endpoint: string, body?: object, options?: FetchOptions) {
    return this.request<T>(endpoint, "PUT", { ...options, body });
  }

  delete<T = H>(endpoint: string, body?: object, options?: FetchOptions) {
    return this.request<T>(endpoint, "DELETE", { ...options, body });
  }
}

const TwitterApi = new CustomFetch(BASE_TWITTER_API, TWITTER_API_KEY);
const MobulaApi = new CustomFetch(TWITTER_ACCOUNTS_ENDPOINT, "");
const HawkApi = new CustomFetch<HawkApiResponse>(
  // "https://hawk-trends-signals.up.railway.app",
  "https://87bbb7c30634.ngrok-free.app",
  BOT_TOKEN
);

export { TwitterApi, MobulaApi, HawkApi };
