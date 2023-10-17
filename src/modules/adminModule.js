const { Router } = require("@grammyjs/router");
const router = new Router((ctx) => ctx.session.step);
const { Keyboard } = require("grammy");
const userModel = require("../models/user.model");
const bot = require("../helper/commands");
const {
  SEARCH,
  SEND_ADMIN,
  ORDERS,
  INFO,
  BACK,
  SEND_ORDER,
  VIEW_ORDER,
  ORDER404,
  BOT_URL,
} = require("../enums/keyboard.vars");
const orderModel = require("../models/order.model");

const buttonRows = [
  [Keyboard.text(SEARCH), Keyboard.text(SEND_ADMIN), Keyboard.text(ORDERS)],
  [Keyboard.text(INFO)],
];
const keyboard = Keyboard.from(buttonRows).resized().oneTime(true);

const AdminMenu = router.route("adminMenu");
AdminMenu.on("message:text", async (ctx) => {
  try {
    await ctx.reply("Kerakli menyulardan birini tanlang👇", {
      reply_markup: keyboard,
    });
  } catch (error) {
    console.log(error.message);
  }
});

const Orders = router.route("orders");
Orders.hears(ORDERS, async (ctx) => {
  try {
    const buttonRows = [
      [Keyboard.text(SEND_ORDER), Keyboard.text(VIEW_ORDER)],
      [Keyboard.text(BACK)],
    ];
    const keyboardOrder = Keyboard.from(buttonRows).resized().oneTime(true);

    await ctx.reply("Kerakli menyulardan birini tanlang👇", {
      reply_markup: keyboardOrder,
    });
    ctx.session.step = "sendOrder";
  } catch (error) {
    console.log(error.message);
  }
});

const SendOrder = router.route("sendOrder");
SendOrder.hears(SEND_ORDER, async (ctx) => {
  try {
    const order = await orderModel.find({ status: true });

    if (!order.length) {
      await ctx.reply("Hozircha buyurtmalar yo'q...");
    } else {
      for (let i = 0; i < order.length; i++) {
        const element = order[i];
        const user = await userModel.findOne({ user_id: element.user_id });

        await ctx.reply(
          `🆔Buyurtma raqami: ${element.order_id}\n\n🧾Buyurtma: ${
            element.order_name
          }\n👤Buyurtma egasi: ${user?.first_name || ""} ${
            user?.last_name || ""
          }\n  ${user?.username || ""}\n\n\nUserId: ${element.user_id}`
        );
      }
      ctx.session.step = "sendOrderById";
    }
  } catch (error) {
    console.log(error.message);
  }
});

const SendOrderByID = router.route("sendOrderById");
SendOrderByID.on(":text", async (ctx) => {
  try {
    const id = ctx.message.text;

    const order = await orderModel.findOne({ order_id: id });
    if (!order) {
      ctx.reply("Siz yuborgan ID: " + id + " topilmadi...😔", {
        reply_markup: keyboard,
      });
    } else {
      const user = await userModel.find({ user_id: order.user_id }).lean();

      await ctx.reply(
        `🆔Buyurtma raqami: ${order.order_id}\n\n🧾Buyurtma: ${
          order.order_name
        }\n👤Buyurtma egasi: ${user[0]?.first_name || ""} ${
          user[0]?.last_name || ""
        }\n  ${user[0]?.username || ""}\n\n\nUserId: ${order.user_id}`
      );
      const buttonRows = [[Keyboard.text(ORDER404), Keyboard.text(BACK)]];
      const keyboard404 = Keyboard.from(buttonRows).resized().oneTime(true);

      let file_id = await ctx.reply("Kitobni jo'nating", {
        reply_markup: keyboard404,
      });

      ctx.session.step = "catchFile";
      ctx.session.catchFile = id;
    }
  } catch (error) {
    console.log(error.message);
  }
});

const Catch = router.route("catchFile");
Catch.on("message", async (ctx) => {
  try {
    let document = ctx.message.document;
    let id = ctx.session.catchFile;

    if (!document) {
      let order = await orderModel.findOne({ order_id: id });
      ctx.api.sendMessage(
        order.user_id,
        "Siz so'ragan kitob afsuski topilmadi...😔"
      );
    } else {
      let order = await orderModel.findOne({ order_id: id });
      let msg_id = await ctx.api.sendDocument(
        "@kitobpdfyuklabotbaza",
        document.file_id,
        { caption: `${ctx.message.caption}\n\n\n${BOT_URL}` }
      );
      order.status = false;
      order.message_id = msg_id.message_id;
      order.save();

      await ctx.api.sendDocument(order.user_id, document.file_id, {
        caption: `${ctx.message.caption}\n\n\n${BOT_URL}`,
      });
    }
    await ctx.reply("Buyurtma bo'yicha amaliyot muvofaqiyatli yakunlandi✅");
  } catch (error) {
    if (error.error_code == 403) {
      await ctx.reply("Bot foydalanuvchi tomonidan bloklangan...");
    } else {
      await ctx.reply("Buyurtma yetkazishda xatolik: " + error.message);
    }
  }
});

bot.hears(VIEW_ORDER, async (ctx) => {
  try {
    let order = await orderModel.find({ status: false });
    for (let i = 0; i < order.length; i++) {
      const element = order[i];
      const user = await userModel.findOne({ user_id: element.user_id });

      await ctx.reply(
        `🆔Buyurtma raqami: ${element.order_id}\n\n🧾Buyurtma: ${
          element.order_name
        }\n👤Buyurtma egasi: ${user?.first_name || ""} ${
          user?.last_name || ""
        }\n  ${user?.username || ""}\n\n\nUserId: ${element.user_id}`
      );
    }
  } catch (error) {
    console.log(error.message);
  }
});

bot.hears(BACK, async (ctx) => {
  try {
    await ctx.reply("Kerakli menyulardan birini tanlang👇", {
      reply_markup: keyboard,
    });
    ctx.session.step = "orders";
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
