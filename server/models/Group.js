// import mongoose, { Schema } from "mongoose";

// const groupSchema = new Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       unique: true,       // ← unique group names
//       trim: true,
//     },
//     description: {
//       type: String,
//       default: "",
//       trim: true,
//     },
//     admin: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,    // ← group creator is admin
//     },
//     members: [{ type: Schema.Types.ObjectId, ref: "User" }],
//     subjects: { type: [String], default: [] },
//     interests: { type: [String], default: [] },
//     isActive: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// export const Group = mongoose.model("Group", groupSchema);




import mongoose, { Schema } from "mongoose";

const groupSchema = new Schema(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "", trim: true },
    admin:       { type: Schema.Types.ObjectId, ref: "User", required: true },
    members:     [{ type: Schema.Types.ObjectId, ref: "User" }],

    // existing
    subjects:  { type: [String], default: [] },
    interests: { type: [String], default: [] },
    isActive:  { type: Boolean, default: true },

    // NEW fields
    studyGoals:   { type: [String], default: [] },
    availability: { type: [String], default: [] },
    skillTags:    { type: [String], default: [] },
    embedding:    { type: [Number], default: [], select: false },
    maxMembers:   { type: Number, default: 10, min: 2, max: 50 },
    category: {
      type: String,
      enum: ["study", "project", "hobby", "professional", "general"],
      default: "study",
    },
  },
  { timestamps: true }
);

groupSchema.index({ subjects: 1 });
groupSchema.index({ interests: 1 });
groupSchema.index({ skillTags: 1 });

export const Group = mongoose.model("Group", groupSchema);