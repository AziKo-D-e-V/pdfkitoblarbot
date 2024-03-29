const { Router } = require("@grammyjs/router");
const router = new Router((ctx) => ctx.session.step);
const { Keyboard } = require("grammy");
const userModel = require("../models/user.model");
const bot = require("../helper/commands");

const {
  SEARCH,
  INFO,
  SEND_ADMIN,
  ORDERS,
  ADMINS,
  USERS,
} = require("../enums/keyboard.vars");
const orderModel = require("../models/order.model");
const config = require("../config");

const buttonRows = [
  [Keyboard.text(SEARCH), Keyboard.text(SEND_ADMIN)],
  [Keyboard.text(INFO)],
];
const keyboard = Keyboard.from(buttonRows).resized().oneTime(true);

const start = router.route("start");
start.on(":text", async (ctx) => {
  try {
    const user_id = ctx.from.id;
    const findUser = await userModel.findOne({ user_id });
    if (findUser.is_admin == false) {
      await ctx.reply("Kerakli menyulardan birini tanlang👇", {
        reply_markup: keyboard,
      });
    } else {
      const buttonRows = [
        [Keyboard.text(ORDERS), Keyboard.text(ADMINS)],
        [Keyboard.text(USERS)],
        [Keyboard.text(SEARCH), Keyboard.text(SEND_ADMIN)],
        [Keyboard.text(INFO)],
      ];
      const keyboardAdmin = Keyboard.from(buttonRows).resized().oneTime(true);

      await ctx.reply("Kerakli menyulardan birini tanlang👇", {
        reply_markup: keyboardAdmin,
      });
      ctx.session.step = "orders";
    }
  } catch (error) {
    console.log(error.message);
    ctx.api.sendMessage(config.GROUP_ID, `<code>${error.message}<code>`, {
      parse_mode: "HTML",
      message_thread_id: config.BOT_ERROR_THREAD_ID,
    });
  }
});

bot.command("start", async (ctx) => {
  try {
    const first_name = ctx.from?.first_name || "";
    const last_name = ctx.from?.last_name || "";
    const user_id = ctx.from.id;
    const username = ctx.from?.username || "";

    await ctx.reply(
      `Assalom aleykum  <b>${
        first_name || last_name
      }</b>👋\n\nMenyulardan birini tanlang👇`,
      {
        parse_mode: "HTML",
        reply_markup: keyboard,
      }
    );

    const findUser = await userModel.findOne({ user_id });

    if (!findUser) {
      const newUser = await userModel.create({
        first_name,
        last_name,
        username,
        user_id,
      });

      ctx.api.sendMessage(
        config.GROUP_ID,
        `#new_user\n\n    First Name: <b>${newUser.first_name}</b>\n    Last Name: <b>${newUser.last_name}</b>\n👤Username: <b>${newUser.username ?  "@" + newUser.username : ""}</b>\n🗿User_id: <tg-spoiler>${newUser.user_id}</tg-spoiler>`,
        {
          parse_mode: "HTML",
          message_thread_id: config.BOT_USERS_THREAD_ID,
        }
      );

      ctx.session.step = "start";
    } else if (findUser.is_admin === true) {
      const buttonRows = [
        [Keyboard.text(ORDERS), Keyboard.text(ADMINS)],
        [Keyboard.text(USERS)],
        [Keyboard.text(SEARCH), Keyboard.text(SEND_ADMIN)],
        [Keyboard.text(INFO)],
      ];
      const keyboardAdmin = Keyboard.from(buttonRows).resized().oneTime(true);

      await ctx.reply("Kerakli menyulardan birini tanlang👇", {
        reply_markup: keyboardAdmin,
      });
      ctx.session.step = "orders";
    } else {
      ctx.session.step = "start";
    }
  } catch (error) {
    ctx.session.step = "start";
    console.log(error.message);
    ctx.api.sendMessage(config.GROUP_ID, `<code>${error.message}<code>`, {
      parse_mode: "HTML",
      message_thread_id: config.BOT_ERROR_THREAD_ID,
    });
  }
});

bot.hears(SEARCH, async (ctx) => {
  try {
    ctx.reply(
      `Bu bo'limi vaqtincha ish faoliyatida emas😔\n\n<b>${SEND_ADMIN}</b>  bo'limi orqali kitobni olishingiz mumkin`,
      {
        parse_mode: "HTML",
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    ctx.api.sendMessage(config.GROUP_ID, `<code>${error.message}<code>`, {
      parse_mode: "HTML",
      message_thread_id: config.BOT_ERROR_THREAD_ID,
    });
    console.log(error.message);
  }
});

bot.hears(SEND_ADMIN, async (ctx) => {
  try {
    ctx.reply(
      'O\'zingiz qidirayotgan kitob nomini hamda kitob mualifini yozib yuboring❗\n\n\nMasalan: \n1. Abdulla Qodiriy "O\'tgan kunlar"\n2. Paulo Koelo "Alkimyogar"'
    );

    ctx.session.step = "order1";
  } catch (error) {
    ctx.api.sendMessage(config.GROUP_ID, `<code>${error.message}<code>`, {
      parse_mode: "HTML",
      message_thread_id: config.BOT_ERROR_THREAD_ID,
    });
    console.log(error.message);
  }
});

const order1 = router.route("order1");
order1.on(":text", async (ctx) => {
  let orderText = ctx.message.text;
  let user_id = ctx.from.id;
  ctx.reply(
    "Siz yuborgan kitob buyurtmasi adminlarga jo'natildi. Adminlar javobini kuting... Kitobingizni tashlab beriladi",
    {
      reply_markup: keyboard,
    }
  );

  const lastOrder = await orderModel.findOne().sort({ order_id: -1 }).exec();

  let orderId;

  if (!lastOrder) {
    orderId = 1;
  } else {
    orderId = lastOrder.order_id + 1;
  }

  let order = await orderModel.create({
    order_id: orderId,
    order_name: orderText,
    user_id,
  });
  ctx.api.sendMessage(
    config.GROUP_ID,
    `🆔Order_id: ${order.order_id}\n\nℹ️Buyurtma: ${
      order.order_name
    }\n🕧Ro'yxatga olingan vaqt: ${order.createdAt.toLocaleString()}`,
    {
      message_thread_id: config.BOT_ORDERS_THREAD_ID,
    }
  );

  ctx.session.step = "start";
});

bot.hears(INFO, async (ctx) => {
  try {
    const copymsg1 = 24;
    const copymsg2 = 24;
    const chatId = ctx.from.id;
    const from_chat_id = -1001975830564;
    ctx.api.copyMessage(chatId, from_chat_id, copymsg1);
    ctx.session.step = "start";
  } catch (error) {
    ctx.session.step = "start";
    ctx.api.sendMessage(5634162263, "Error command 'info'\n\n" + error.message);
    console.log(error.message);
  }
});

module.exports = router;
