import mongoose from "mongoose";

const colorSettingsSchema = new mongoose.Schema(
  {
    colors: [
      {
        name: {
          type: String,
          required: true,
        },
        hexCode: {
          type: String,
          required: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ColorSettings", colorSettingsSchema);
