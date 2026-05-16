import mongoose, { Schema } from "mongoose";

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    subjects: {
      type: [String],  // common subjects across the group
      default: [],
    },
    interests: {
      type: [String],  // common interests across the group
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Group = mongoose.model("Group", groupSchema);