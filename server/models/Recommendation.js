import mongoose, { Schema } from "mongoose";

const recommendationSchema = new Schema(
  {
    user:  { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },

    score:             { type: Number, required: true },
    keywordScore:      { type: Number, default: 0 },
    embeddingScore:    { type: Number, default: 0 },
    clusterScore:      { type: Number, default: 0 },
    availabilityScore: { type: Number, default: 0 },

    matchedTags:  { type: [String], default: [] },
    aiReasoning:  { type: String, default: "" },

    status:     { type: String, enum: ["pending", "joined", "dismissed"], default: "pending" },
    actionedAt: { type: Date },
  },
  { timestamps: true }
);

recommendationSchema.index({ user: 1, group: 1 }, { unique: true });
recommendationSchema.index({ user: 1, status: 1 });

export const Recommendation = mongoose.model("Recommendation", recommendationSchema);