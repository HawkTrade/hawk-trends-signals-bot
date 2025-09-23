import * as v from "valibot";

const TwitterUsernameSchema = v.pipe(
  v.string("Username must be a string"),
  v.minLength(1, "Username must be at least 1 character."),
  v.maxLength(15, "Username must be at most 15 characters."),
  v.regex(/^[A-Za-z0-9_]+$/, "Username can only contain letters, numbers, and underscores.")
);

const TelegramChannelOrInviteSchema = v.union([
  v.pipe(
    v.string("Input must be a string"),
    v.regex(
      /^@[a-zA-Z0-9_]{5,32}$/,
      "Must be a valid Telegram username starting with @ (5–32 chars, letters, numbers, underscores)."
    )
  ),

  v.pipe(
    v.string("Input must be a string"),
    v.regex(/^[a-zA-Z0-9_]{5,32}$/, "Must be a valid Telegram username (5–32 chars, letters, numbers, underscores).")
  ),

  v.pipe(
    v.string("Input must be a string"),
    v.regex(
      /^(https?:\/\/)?t\.me\/(\+|joinchat\/)?[A-Za-z0-9_-]+$/,
      "Must be a valid Telegram invite link (t.me/joinchat/... or t.me/+...)."
    )
  ),
]);

const FilterRuleSchema = v.object({
  usernames: v.pipe(
    v.array(TwitterUsernameSchema, "Usernames must be an array of valid Twitter usernames."),
    v.minLength(1, "At least one username is required."),
    v.maxLength(5, "You can specify at most 5 usernames.")
  ),
  tag: v.optional(v.pipe(v.string("Tag must be a string"), v.maxLength(255, "Tag must be at most 255 characters."))),
  interval: v.optional(
    v.pipe(v.number("Interval must be a number"), v.maxValue(86400, "Interval cannot exceed 86400 seconds (24 hours)."))
  ),
});

export { FilterRuleSchema, TwitterUsernameSchema, TelegramChannelOrInviteSchema };
