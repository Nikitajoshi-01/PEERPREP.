import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isAI:    { type: Boolean, default: false },  // ← NEW
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);