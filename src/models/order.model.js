const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: Number,
      unique: true,
    },
    order_name: {
      type: "String",
      required: true,
    },
    user_id: {
      type: Number,
      required: true,
    },
    status: {
      type: "Boolean",
      default: true,
    },
    message_id: {
      type: "String",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Orders", orderSchema);
