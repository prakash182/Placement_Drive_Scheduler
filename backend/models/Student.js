const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    branch: {
      type: String,
      required: true,
      trim: true,
    },

    cgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },

    shortlistedCompanies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
    ],

    status: {
      type: String,
      enum: ["active", "withdrawn", "placed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", studentSchema);