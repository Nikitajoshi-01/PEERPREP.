// import mongoose, { Schema } from "mongoose";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";

// const userSchema = new Schema(
//   {
//     username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     fullName: { type: String, required: true, trim: true, index: true },
//     avatar: { type: String, required: true },
//     coverImage: { type: String },
//     password: { type: String, required: [true, "Password is required"] },
//     refreshToken: { type: String },

//     // ─── Study profile ────────────────────────────────────────
//     subjects: { type: [String], default: [] },
//     interests: { type: [String], default: [] },
//     studyGoals: { type: [String], default: [] },
//     availability: { type: [String], default: [] },

//     // ─── Multiple groups (max 5) ──────────────────────────────
//     groups: [{ type: Schema.Types.ObjectId, ref: "Group", default: [] }],
//   },
//   { timestamps: true }
// );

// userSchema.pre("save", async function () {
//   if (!this.isModified("password")) return;
//   this.password = await bcrypt.hash(this.password, 10);
// });

// userSchema.methods.isPasswordCorrect = async function (password) {
//   return await bcrypt.compare(password, this.password);
// };

// userSchema.methods.generateAccessToken = function () {
//   return jwt.sign(
//     { _id: this._id, email: this.email, username: this.username, fullName: this.fullName },
//     process.env.ACCESS_TOKEN_SECRET,
//     { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
//   );
// };

// userSchema.methods.generateRefreshToken = function () {
//   return jwt.sign(
//     { _id: this._id },
//     process.env.REFRESH_TOKEN_SECRET,
//     { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
//   );
// };

// export const User = mongoose.model("User", userSchema);



import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    username:     { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName:     { type: String, required: true, trim: true, index: true },
    avatar:       { type: String, required: true },
    coverImage:   { type: String },
    password:     { type: String, required: [true, "Password is required"] },
    refreshToken: { type: String },

    // existing
    subjects:     { type: [String], default: [] },
    interests:    { type: [String], default: [] },
    studyGoals:   { type: [String], default: [] },
    availability: { type: [String], default: [] },

    // NEW fields
    skillLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    skillTags:          { type: [String], default: [] },
    preferredGroupSize: { type: String, enum: ["small", "medium", "large"], default: "medium" },
    embedding:          { type: [Number], default: [], select: false },

    groups: [{ type: Schema.Types.ObjectId, ref: "Group", default: [] }],
  },
  { timestamps: true }
);

// hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// auto-rebuild skillTags when profile changes
userSchema.pre("save", function (next) {
  const changed = ["subjects", "interests", "studyGoals"].some((f) => this.isModified(f));
  if (changed) {
    this.skillTags = [...new Set([
      ...this.subjects,
      ...this.interests,
      ...this.studyGoals,
    ].map((t) => t.toLowerCase().trim()))];
  }
  // next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, username: this.username, fullName: this.fullName },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model("User", userSchema);