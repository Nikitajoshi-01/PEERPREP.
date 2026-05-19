import mongoose, { Schema } from "mongoose";

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,       // ← unique group names
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,    // ← group creator is admin
    },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    subjects: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Group = mongoose.model("Group", groupSchema);