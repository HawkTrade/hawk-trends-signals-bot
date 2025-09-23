import Database from "better-sqlite3";
import type { Session } from "../models/telegraf.model";
import type { SessionStore } from "telegraf";
import type { SessionRow } from "../models/db.model";

const db = new Database("./sessions.db");

db.prepare(
  "CREATE TABLE IF NOT EXISTS sessions (key TEXT PRIMARY KEY, value TEXT)"
).run();

const store: SessionStore<Session> = {
  get(key: string) {
    const row = db
      .prepare("SELECT value FROM sessions WHERE key = ?")
      .get(key) as SessionRow | undefined;
    return row ? JSON.parse(row.value) : null;
  },
  set(key: string, value: any) {
    db.prepare(
      "INSERT OR REPLACE INTO sessions (key, value) VALUES (?, ?)"
    ).run(key, JSON.stringify(value));
  },
  delete(key: string) {
    db.prepare("DELETE FROM sessions WHERE key = ?").run(key);
  },
};

export default store;
