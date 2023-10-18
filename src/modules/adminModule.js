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
  ADMIN_ADD,
  ADMINS,
  ADMIN_DELETE,
  ADMIN_PERMISSION,
  USERS,
  COUNT_USERS,
  SEND_ADD,
} = require("../enums/keyboard.vars");
const orderModel = require("../models/order.model");

const buttonRows = [
  [Keyboard.text(ORDERS), Keyboard.text(ADMINS)],
  [Keyboard.text(USERS)],
  [Keyboard.text(SEARCH), Keyboard.text(SEND_ADMIN)],
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
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
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
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

const SendOrder = router.route("sendOrder");
SendOrder.hears(SEND_ORDER, async (ctx) => {
  try {
    const order = await orderModel
      .find({ status: true })
      .sort({ _id: -1 })
      .limit(5);

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
    if (error.error_code === 400) {
      await ctx.reply(
        "Foydalanuvchi bilan muammo yuzaga keldi: " + error.message
      );
    } else if (error.error_code == 403) {
      await ctx.reply("Bot foydalanuvchi tomonidan bloklangan...");
    } else {
      await ctx.reply("Buyurtma yetkazishda xatolik: " + error.message);
    }
    console.log(error);
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
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

const Catch = router.route("catchFile");
Catch.on("message", async (ctx) => {
  try {
    let document = ctx.message.document;
    let id = ctx.session.catchFile;

    if (!document) {
      let order = await orderModel.findOne({ order_id: id });
      order.status = false;
      order.save();
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
    console.log(error);
  }
});

SendOrder.hears(VIEW_ORDER, async (ctx) => {
  try {
    let order = await orderModel
      .find({ status: false })
      .sort({ _id: -1 })
      .limit(5);
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
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

bot.hears(ADMINS, async (ctx) => {
  try {
    const buttonRows = [
      [Keyboard.text(ADMIN_ADD), Keyboard.text(ADMIN_DELETE)],
      [Keyboard.text(BACK)],
    ];
    const keyboardAdmin = Keyboard.from(buttonRows).resized().oneTime(true);
    const user = await userModel.find({ is_admin: true }).lean();

    for (let i = 0; i < user.length; i++) {
      const element = user[i];
      await ctx.reply(
        `👮‍♂️Admin: ${element?.first_name || ""} ${element?.last_name || ""}\n @${
          element?.username || ""
        }\n\n🆔AdminID: ${element.user_id}`,
        {
          reply_markup: keyboardAdmin,
        }
      );
    }
    ctx.session.step = "adminsSetting";
  } catch (error) {
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

const SettingAdmin = router.route("adminsSetting");
SettingAdmin.hears(ADMIN_ADD, async (ctx) => {
  try {
    const buttonRows = [[Keyboard.text(BACK)]];
    const keyboardAdminAdd = Keyboard.from(buttonRows).resized().oneTime(true);
    ctx.reply(
      "Admin qo'shish uchun user ning username yoki user_id ni jo'nating❗",
      {
        reply_markup: keyboardAdminAdd,
      }
    );
    ctx.session.step = "admin-add";
  } catch (error) {
    if (error.error_code == 403) {
      await ctx.reply("Bot foydalanuvchi tomonidan bloklangan...");
    } else {
      await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
    }
    console.log(error);
  }
});

const AdminAdd = router.route("admin-add");
AdminAdd.on("message", async (ctx) => {
  try {
    const newAdminInfo = ctx.message.text?.split("@")[1] || ctx.message.text;
    const findUserByUsername = await userModel
      .findOne({
        username: newAdminInfo.toString(),
      })
      .lean();

    if (!findUserByUsername == null) {
      await ctx.reply("Siz yuborgan user topilmadi...😔");
      ctx.session.step = "admin-add";
    } else if (findUserByUsername) {
      const buttonRows = [
        [Keyboard.text(ADMIN_PERMISSION)],
        [Keyboard.text(BACK)],
      ];
      const keyboardAdminAdd = Keyboard.from(buttonRows)
        .resized()
        .oneTime(true);
      await ctx.reply(
        `User: ${findUserByUsername?.first_name || ""} ${
          findUserByUsername?.last_name || ""
        }\n @${findUserByUsername?.username || ""}\n\n🆔UserId: ${
          findUserByUsername.user_id
        }`,
        {
          reply_markup: keyboardAdminAdd,
        }
      );
      let id = findUserByUsername.user_id;
      await ctx.reply("Admin qilishga ruxsat berasizmi");
      ctx.session.step = "adminPermission";
      ctx.session.adminPermission = id;
    }

    const findUserByUserId = await userModel.findOne({
      user_id: +newAdminInfo,
      is_admin: false,
    });
    if (findUserByUserId == null) {
      await ctx.reply("Siz yuborgan user topilmadi...😔");
      ctx.session.step = "admin-add";
    } else if (findUserByUserId) {
      const buttonRows = [
        [Keyboard.text(ADMIN_PERMISSION)],
        [Keyboard.text(BACK)],
      ];
      const keyboardAdminAdd = Keyboard.from(buttonRows)
        .resized()
        .oneTime(true);
      await ctx.reply(
        `User: ${findUserByUserId?.first_name || ""} ${
          findUserByUserId?.last_name || ""
        }\n @${findUserByUserId?.username || ""}\n\n🆔UserId: ${
          findUserByUserId.user_id
        }`,
        {
          reply_markup: keyboardAdminAdd,
        }
      );
      await ctx.reply("Admin qilishga ruxsat berasizmi");
      ctx.session.step = "adminPermission";
      ctx.session.adminPermission = findUserByUserId.user_id;
    }
  } catch (error) {
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

const Permission = router.route("adminPermission");
Permission.on(":text", async (ctx) => {
  try {
    const user_id = ctx.session.adminPermission;

    const findUser = await userModel.findOne({ user_id });

    findUser.is_admin = true;
    findUser.save();

    await ctx.reply("Admin muvofaqiyatli qo'shildi", {
      reply_markup: keyboard,
    });
  } catch (error) {
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

SettingAdmin.hears(ADMIN_DELETE, async (ctx) => {
  try {
    const buttonRows = [[Keyboard.text(BACK)]];
    const keyboardDel = Keyboard.from(buttonRows).resized().oneTime(true);
    ctx.reply(
      "Adminlikni olib tashlamoqchi bo'lgan adminni <b>AdminId</b> sini jo'nating",
      {
        reply_markup: keyboardDel,
        parse_mode: "HTML",
      }
    );
    ctx.session.step = "adminDelete";
  } catch (error) {
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

const adminDelete = router.route("adminDelete");
adminDelete.on(":text", async (ctx) => {
  try {
    const generalAdminId = 5634162263;
    let yourId = ctx.from.id;
    const adminID = ctx.message.text;

    const findAdmin = await userModel.findOne({
      is_admin: true,
      user_id: adminID,
    });
    if (!findAdmin) {
      ctx.reply(
        "Siz yuborgan <b>AdminId</b> ADMINLAR orasidan topilmadi😔. Qaytadan <b>AdminId</b> ni to'g'ri jo'nating...",
        { parse_mode: "HTML" }
      );
      ctx.session.step = "adminDelete";
    } else if (adminID == generalAdminId) {
      ctx.reply(
        "Bu Admindan adminlikni olish mumkin emas😠. Qaytadan <b>AdminId</b> ni to'g'ri jo'nating...",
        { parse_mode: "HTML" }
      );
      ctx.session.step = "adminDelete";
    } else if (+adminID == yourId) {
      await ctx.reply(
        "Siz o'zingizdan adminlikni olib tashlay olmaysiz😠. Qaytadan <b>AdminId</b> ni to'g'ri jo'nating...",
        { parse_mode: "HTML" }
      );
      ctx.session.step = "adminDelete";
    } else {
      findAdmin.is_admin = false;
      findAdmin.save();

      await ctx.reply("Admin muvofaqiyatli olib tashlandi✅", {
        reply_markup: keyboard,
      });

      ctx.session.step = "adminMenu";
    }
  } catch (error) {
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

bot.hears(USERS, async (ctx) => {
  try {
    const buttonRows = [
      [Keyboard.text(COUNT_USERS), Keyboard.text(SEND_ADD)],
      [Keyboard.text(BACK)],
    ];
    const keyboardUserDep = Keyboard.from(buttonRows).resized().oneTime(true);
    await ctx.reply("Kerakli menyulardan birini tanlang👇", {
      reply_markup: keyboardUserDep,
    });
    ctx.session.step = "userDepartment";
  } catch (error) {
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

const userDepartment = router.route("userDepartment");
userDepartment.hears(COUNT_USERS, async (ctx) => {
  try {
    const buttonRows = [[Keyboard.text(BACK)]];
    const keyboardDel = Keyboard.from(buttonRows).resized().oneTime(true);

    const user_id = ctx.from.id;
    const findUser = await userModel.findOne({ user_id }).lean();
    if (findUser.is_admin == true) {
      const messageCount = await orderModel.count().lean();
      const userCount = await userModel.count().lean();
      ctx.reply(
        `📝Buyurtmalar soni: ${messageCount}\n\n👥Users: ${userCount}`,
        {
          reply_markup: keyboardDel,
        }
      );
    } else {
      ctx.reply("/count commanddasini ko'rish uchun sizda ruxsat yo'q😔");
    }
  } catch (error) {
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

userDepartment.hears(SEND_ADD, async (ctx) => {
  try {
    const buttonRows = [[Keyboard.text(BACK)]];
    const keyboardDel = Keyboard.from(buttonRows).resized().oneTime(true);

    ctx.reply("Reklama xabarini jo'nating", { reply_markup: keyboardDel });

    ctx.session.step = "catch_ad";
  } catch (error) {
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

const catchAd = router.route("catch_ad");
catchAd.on("message", async (ctx) => {
  try {
    const message = ctx.message.text;
    const chat_id = 5634162263;
    const users = await userModel.find();
    for (let i = 0; i < users.length; i++) {
      try {
        const user_id = users[i].user_id;
        await ctx.api.sendMessage(user_id, message);
      } catch (error) {
        console.log(error.error_code, error.message);
        i++;
      }
    }
    await ctx.reply("Reklama hamma users ga jo'natildi✅✅✅");
  } catch (error) {
    ctx.reply("Reklama yuborishda xatolik ro'y berdi😔\n\n" + error.message);
    ctx.session.step = "send_ad";
    console.log(error);
  }
});
bot.hears(BACK, async (ctx) => {
  try {
    const user_id = ctx.from.id;
    const findUser = await userModel.findOne({ user_id });

    if (findUser.is_admin == true) {
      await ctx.reply("Kerakli menyulardan birini tanlang👇", {
        reply_markup: keyboard,
      });
    } else {
      const buttonRows = [
        [Keyboard.text(SEARCH), Keyboard.text(SEND_ADMIN)],
        [Keyboard.text(INFO)],
      ];
      const keyboardAdmin = Keyboard.from(buttonRows).resized().oneTime(true);

      await ctx.reply("Kerakli menyulardan birini tanlang👇", {
        reply_markup: keyboardAdmin,
      });
    }
    ctx.session.step = "orders";
  } catch (error) {
    console.log(error);
    await ctx.reply("Bot bilan ishlashda xatolik: " + error.message);
  }
});

module.exports = router;
