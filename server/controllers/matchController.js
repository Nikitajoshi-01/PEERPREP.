import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.js";
import { Group } from "../models/Group.js";
import { findBestMatches } from "../utils/matchingAlgorithm.js";

// ─── REQUEST MATCH ────────────────────────────────────────────────
const requestMatch = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);

  // check if already in a group
  if (currentUser.isMatched) {
    throw new ApiError(400, "You are already matched in a group");
  }

  // check if study profile is filled
  if (!currentUser.subjects.length && !currentUser.interests.length) {
    throw new ApiError(400, "Please update your study profile before matching");
  }

  // find all other unmatched users
  const unmatchedUsers = await User.find({
    _id: { $ne: currentUser._id },
    isMatched: false,
  });

  const bestMatches = findBestMatches(currentUser, unmatchedUsers);

  // if no matches found, put them in a solo waiting group
  const groupMembers = [currentUser._id, ...bestMatches.map((u) => u._id)];

  // find common subjects and interests across group
  const allSubjects = [currentUser, ...bestMatches].flatMap((u) => u.subjects);
  const allInterests = [currentUser, ...bestMatches].flatMap((u) => u.interests);

  const commonSubjects = [...new Set(allSubjects)];
  const commonInterests = [...new Set(allInterests)];

  // create group
  const group = await Group.create({
    name: `Study Group - ${commonSubjects[0] || "General"}`,
    members: groupMembers,
    subjects: commonSubjects,
    interests: commonInterests,
  });

  // mark all matched users
  await User.updateMany(
    { _id: { $in: groupMembers } },
    { $set: { isMatched: true, matchedGroup: group._id } }
  );

  const populatedGroup = await Group.findById(group._id).populate(
    "members",
    "fullName username avatar subjects interests"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, populatedGroup, "Match found! Study group created"));
});

// ─── GET MY GROUP ─────────────────────────────────────────────────
const getMyGroup = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user.matchedGroup) {
    throw new ApiError(404, "You are not in any group yet");
  }

  const group = await Group.findById(user.matchedGroup).populate(
    "members",
    "fullName username avatar subjects interests"
  );

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, group, "Group fetched successfully"));
});

// ─── LEAVE GROUP ──────────────────────────────────────────────────
const leaveGroup = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user.matchedGroup) {
    throw new ApiError(400, "You are not in any group");
  }

  // remove user from group members
  await Group.findByIdAndUpdate(user.matchedGroup, {
    $pull: { members: user._id },
  });

  // reset user match status
  await User.findByIdAndUpdate(user._id, {
    $set: { isMatched: false, matchedGroup: null },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "You have left the group"));
});

export { requestMatch, getMyGroup, leaveGroup };