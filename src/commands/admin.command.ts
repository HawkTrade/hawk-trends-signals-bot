import { bold, fmt, join, mention } from "telegraf/format";
import { Context } from "../models/telegraf.model";
import { HawkApiResponse } from "../models/twitter.api";
import { HawkApi } from "../utils/fetch";
import { errorWrapper, validateCallerIsAdmin } from "../utils/helpers";
import { getAdminsFromId } from "../utils/utils";

async function _addAdminCmd(ctx: Context) {
  await validateCallerIsAdmin(ctx);

  ctx.session.state = "admin_add";
  const { message_id } = await ctx.reply(
    "Please enter the Telegram ID of user to give admin access:",
    {
      reply_markup: { force_reply: true },
    }
  );
  ctx.session.toDelete.push(message_id);
}

async function _removeAdminCmd(ctx: Context) {
  await validateCallerIsAdmin(ctx);
  const { data, error } = await HawkApi.get<HawkApiResponse<number[]>>(
    "/admin"
  );

  if (error) throw error;
  if (!data || data.length === 0) {
    return await ctx.reply("No admins found.");
  }

  const admins = await getAdminsFromId(data, ctx);
  const keyboard = data.map((id, i) => [
    {
      text: admins[i] || id.toString(),
      callback_data: `admin_remove:${id}`,
    },
  ]);

  await ctx.reply("Select an admin to remove:", {
    reply_markup: { inline_keyboard: keyboard },
  });
}

async function _getAdminsCmd(ctx: Context) {
  const { data, error, msg } = await HawkApi.get<HawkApiResponse<number[]>>(
    "/admin"
  );
  if (error) throw error;
  if (!msg || !data) throw new Error("An API response error occured");

  const admins =
    data && data.length > 0 ? await getAdminsFromId(data, ctx) : [];

  const admin_messages = data.map(
    (id, i) => fmt`• ${mention(admins[i] ?? id, id)}`
  );
  const message = fmt`${bold`${msg}`}
 
${join(admin_messages, "\n")}
  `;

  await ctx.reply(message);
}

const addAdminCmd = errorWrapper(_addAdminCmd);
const removeAdminCmd = errorWrapper(_removeAdminCmd);
const getAdminsCmd = errorWrapper(_getAdminsCmd);

export { addAdminCmd, removeAdminCmd, getAdminsCmd };
