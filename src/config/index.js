require("dotenv").config();

const config = {
  TOKEN: process.env.TOKEN,
  DB_URL: process.env.DB_URL,
  GROUP_ID: "-1001682686838",
  PDF_BOOKS_THREAD_ID: "153",
  BOT_USERS_THREAD_ID: "151",
  BOT_ORDERS_THREAD_ID: "149",
  BOT_ERROR_THREAD_ID: "155"
};

module.exports = config;
