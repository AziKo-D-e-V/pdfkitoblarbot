const config = require("./config");
const { connect } = require("mongoose");
const { Bot, session } = require("grammy");
require("dotenv/config");
const commandBot = require("./helper/commands");
const BaseModule = require("./modules/baseModule");
const AdminModule = require("./modules/adminModule");

const token = config.TOKEN;
const bot = new Bot(token);

bot.use(
  session({
    initial: () => ({
      step: "start",
    }),
  })
);

bot.use(commandBot);
bot.use(BaseModule);
bot.use(AdminModule);

const bootstrap = async (bot) => {
  try {
    const connetParams = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    connect(config.DB_URL, connetParams);
    console.log("Kitob-yukla-bot * * * * - Database connection");
  } catch (error) {
    console.log(error.message);
  }
};
bootstrap();
bot.start(console.log("Kitob-yukla-bot started"));
