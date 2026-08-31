const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },

    available: {
      type: Boolean,
      default: true,
    },

    unavailableReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);