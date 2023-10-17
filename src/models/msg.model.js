const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
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
      type: "Number",
      required: true,
    },
    message: {
      type: "String",
      required: true,
    },
    forward_date: {
      type: "Number",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Messages", messageSchema);
