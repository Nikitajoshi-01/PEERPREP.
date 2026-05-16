import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.js";

// ─── UPDATE STUDY PROFILE ─────────────────────────────────────────
const updateStudyProfile = asyncHandler(async (req, res) => {
  const { subjects, interests, studyGoals, availability } = req.body;

  if (!subjects && !interests && !studyGoals && !availability) {
    throw new ApiError(400, "At least one field is required");
  }

  const updateFields = {};
  if (subjects) updateFields.subjects = subjects;
  if (interests) updateFields.interests = interests;
  if (studyGoals) updateFields.studyGoals = studyGoals;
  if (availability) updateFields.availability = availability;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateFields },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Study profile updated successfully"));
});

// ─── GET USER PROFILE ─────────────────────────────────────────────
const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username }).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile fetched successfully"));
});

export { updateStudyProfile, getUserProfile };