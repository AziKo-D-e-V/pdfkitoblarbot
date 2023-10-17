const mongoose = require("mongoose");

const user = new mongoose.Schema(
  {
    first_name: {
      type: "String",
    },
    last_name: {
      type: "String",
    },
    username: {
      type: "String",
    },
    user_id: {
      type: Number,
      required: true,
    },
    is_admin: {
      type: "Boolean",
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", user);
