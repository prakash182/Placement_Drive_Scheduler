const mongoose = require("mongoose");

const panelSchema = new mongoose.Schema(
  {
    panelId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    members: [
      {
        type: String,
        trim: true,
      },
    ],

    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
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

module.exports = mongoose.model("Panel", panelSchema);