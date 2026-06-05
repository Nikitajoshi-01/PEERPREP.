// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { User } from "../models/User.js";
// import { Group } from "../models/Group.js";
// import { findBestMatches } from "../utils/matchingAlgorithm.js";

// // ─── GET SUGGESTED MATCHES ────────────────────────────────────────
// // returns list of users + existing groups that match current user's profile
// const getSuggestedMatches = asyncHandler(async (req, res) => {
//   const currentUser = await User.findById(req.user._id);

//   if (!currentUser.subjects.length && !currentUser.interests.length) {
//     throw new ApiError(400, "Please update your study profile first");
//   }

//   // find all other users not already in a group with current user
//   const otherUsers = await User.find({
//     _id: { $ne: currentUser._id },
//   }).select("fullName username avatar subjects interests studyGoals availability groups");

//   // score and sort them
//   const scoredUsers = otherUsers
//     .map((u) => ({
//       user: u,
//       score: scoreUsers(currentUser, u),
//     }))
//     .filter((e) => e.score > 0)
//     .sort((a, b) => b.score - a.score)
//     .slice(0, 10)
//     .map((e) => ({ ...e.user.toObject(), matchScore: e.score }));

//   // find existing groups that match user's subjects/interests
//   const suggestedGroups = await Group.find({
//     $or: [
//       { subjects: { $in: currentUser.subjects } },
//       { interests: { $in: currentUser.interests } },
//     ],
//     members: { $ne: currentUser._id }, // not already a member
//     isActive: true,
//   })
//     .populate("admin", "fullName username avatar")
//     .populate("members", "fullName username avatar")
//     .limit(10);

//   return res.status(200).json(
//     new ApiResponse(200, { suggestedUsers: scoredUsers, suggestedGroups }, "Suggestions fetched")
//   );
// });

// // ─── SCORING HELPER ───────────────────────────────────────────────
// const scoreUsers = (currentUser, otherUser) => {
//   let score = 0;
//   const sharedSubjects = currentUser.subjects.filter((s) => otherUser.subjects.includes(s));
//   const sharedInterests = currentUser.interests.filter((i) => otherUser.interests.includes(i));
//   score += sharedSubjects.length * 2;
//   score += sharedInterests.length * 1;
//   return score;
// };

// // ─── CREATE GROUP ─────────────────────────────────────────────────
// const createGroup = asyncHandler(async (req, res) => {
//   const { name, description } = req.body;
//   const currentUser = await User.findById(req.user._id);

//   if (!name?.trim()) throw new ApiError(400, "Group name is required");

//   // max 5 groups
//   if (currentUser.groups.length >= 5) {
//     throw new ApiError(400, "You can only be in a maximum of 5 groups");
//   }

//   // check unique name
//   const existing = await Group.findOne({ name: name.trim() });
//   if (existing) throw new ApiError(409, "A group with this name already exists");

//   if (!currentUser.subjects.length && !currentUser.interests.length) {
//     throw new ApiError(400, "Please update your study profile first");
//   }

//   const group = await Group.create({
//     name: name.trim(),
//     description: description?.trim() || "",
//     admin: currentUser._id,
//     members: [currentUser._id],
//     subjects: currentUser.subjects,
//     interests: currentUser.interests,
//   });

//   // add group to user's groups array
//   await User.findByIdAndUpdate(currentUser._id, {
//     $push: { groups: group._id },
//   });

//   const populated = await Group.findById(group._id)
//     .populate("admin", "fullName username avatar")
//     .populate("members", "fullName username avatar subjects interests");

//   return res.status(201).json(new ApiResponse(201, populated, "Group created successfully"));
// });

// // ─── JOIN GROUP ───────────────────────────────────────────────────
// const joinGroup = asyncHandler(async (req, res) => {
//   const { groupId } = req.params;
//   const currentUser = await User.findById(req.user._id);

//   // max 5 groups
//   if (currentUser.groups.length >= 5) {
//     throw new ApiError(400, "You can only be in a maximum of 5 groups");
//   }

//   const group = await Group.findById(groupId);
//   if (!group) throw new ApiError(404, "Group not found");
//   if (!group.isActive) throw new ApiError(400, "This group is no longer active");

//   // already a member
//   if (group.members.includes(currentUser._id)) {
//     throw new ApiError(400, "You are already a member of this group");
//   }

//   // add user to group
//   await Group.findByIdAndUpdate(groupId, {
//     $push: { members: currentUser._id },
//   });

//   // add group to user
//   await User.findByIdAndUpdate(currentUser._id, {
//     $push: { groups: groupId },
//   });

//   const populated = await Group.findById(groupId)
//     .populate("admin", "fullName username avatar")
//     .populate("members", "fullName username avatar subjects interests");

//   return res.status(200).json(new ApiResponse(200, populated, "Joined group successfully"));
// });

// // ─── LEAVE GROUP ──────────────────────────────────────────────────
// const leaveGroup = asyncHandler(async (req, res) => {
//   const { groupId } = req.params;
//   const currentUser = await User.findById(req.user._id);

//   const group = await Group.findById(groupId);
//   if (!group) throw new ApiError(404, "Group not found");

//   if (!group.members.includes(currentUser._id)) {
//     throw new ApiError(400, "You are not a member of this group");
//   }

//   // if admin leaves and there are other members — transfer admin
//   if (group.admin.toString() === currentUser._id.toString() && group.members.length > 1) {
//     const newAdmin = group.members.find(
//       (m) => m.toString() !== currentUser._id.toString()
//     );
//     await Group.findByIdAndUpdate(groupId, {
//       $pull: { members: currentUser._id },
//       $set: { admin: newAdmin },
//     });
//   } else if (group.members.length === 1) {
//     // last member leaving — deactivate group
//     await Group.findByIdAndUpdate(groupId, {
//       $pull: { members: currentUser._id },
//       $set: { isActive: false },
//     });
//   } else {
//     await Group.findByIdAndUpdate(groupId, {
//       $pull: { members: currentUser._id },
//     });
//   }

//   // remove group from user
//   await User.findByIdAndUpdate(currentUser._id, {
//     $pull: { groups: groupId },
//   });

//   return res.status(200).json(new ApiResponse(200, {}, "Left group successfully"));
// });

// // ─── GET MY GROUPS ────────────────────────────────────────────────
// const getMyGroups = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id).populate({
//     path: "groups",
//     populate: [
//       { path: "admin", select: "fullName username avatar" },
//       { path: "members", select: "fullName username avatar" },
//     ],
//   });

//   return res.status(200).json(new ApiResponse(200, user.groups, "Groups fetched successfully"));
// });

// // ─── UPDATE GROUP (admin only) ────────────────────────────────────
// const updateGroup = asyncHandler(async (req, res) => {
//   const { groupId } = req.params;
//   const { name, description } = req.body;

//   const group = await Group.findById(groupId);
//   if (!group) throw new ApiError(404, "Group not found");

//   // only admin can edit
//   if (group.admin.toString() !== req.user._id.toString()) {
//     throw new ApiError(403, "Only the group admin can edit group details");
//   }

//   // check unique name if changed
//   if (name && name.trim() !== group.name) {
//     const existing = await Group.findOne({ name: name.trim() });
//     if (existing) throw new ApiError(409, "A group with this name already exists");
//   }

//   const updated = await Group.findByIdAndUpdate(
//     groupId,
//     {
//       $set: {
//         ...(name && { name: name.trim() }),
//         ...(description !== undefined && { description: description.trim() }),
//       },
//     },
//     { new: true }
//   )
//     .populate("admin", "fullName username avatar")
//     .populate("members", "fullName username avatar");

//   return res.status(200).json(new ApiResponse(200, updated, "Group updated successfully"));
// });

// // ─── SEARCH GROUPS ────────────────────────────────────────────────
// const searchGroups = asyncHandler(async (req, res) => {
//   const { q } = req.query;

//   if (!q?.trim()) throw new ApiError(400, "Search query is required");

//   const groups = await Group.find({
//     name: { $regex: q.trim(), $options: "i" }, // case-insensitive search
//     isActive: true,
//   })
//     .populate("admin", "fullName username avatar")
//     .populate("members", "fullName username avatar")
//     .limit(20);

//   return res.status(200).json(new ApiResponse(200, groups, "Search results"));
// });

// export {
//   getSuggestedMatches,
//   createGroup,
//   joinGroup,
//   leaveGroup,
//   getMyGroups,
//   updateGroup,
//   searchGroups,
// };


import { asyncHandler }   from "../utils/asyncHandler.js";
import { ApiError }       from "../utils/ApiError.js";
import { ApiResponse }    from "../utils/ApiResponse.js";
import { User }           from "../models/User.js";
import { Group }          from "../models/Group.js";
import { Recommendation } from "../models/Recommendation.js";
import {
  scoreUserGroup,
  generateReasonings,
  buildProfileText,
  getEmbedding,
} from "../utils/matchingAlgorithm.js";

// ── helper: generate & store embedding if missing ─────────────────
const ensureUserEmbedding = async (user) => {
  if (user.embedding?.length) return;
  const vec = await getEmbedding(buildProfileText(user));
  if (vec) await User.findByIdAndUpdate(user._id, { $set: { embedding: vec } });
  user.embedding = vec ?? [];
};

// ── NEW: GET /api/match/ai-recommendations ─────────────────────────
export const getAIRecommendations = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id).select("+embedding");

  if (!currentUser.subjects.length && !currentUser.interests.length) {
    throw new ApiError(400, "Please update your study profile first");
  }

  const groups = await Group.find({
    isActive: true,
    members:  { $ne: currentUser._id },
  })
    .select("+embedding")
    .populate("admin",   "fullName username avatar")
    .populate("members", "fullName username avatar");

  if (!groups.length) {
    return res.status(200).json(new ApiResponse(200, [], "No groups available"));
  }

  await ensureUserEmbedding(currentUser);

  // score all groups in parallel
  const scored = await Promise.all(
    groups.map(async (g) => ({ group: g, ...(await scoreUserGroup(currentUser, g)) }))
  );

  const top = scored
    .filter((s) => s.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // get Claude reasoning
  const reasonings = await generateReasonings(currentUser, top);
  const reasonMap  = Object.fromEntries(reasonings.map((r) => [r.groupId, r.reason]));

  // upsert to DB + build response
  const results = [];
  for (const item of top) {
    const reason = reasonMap[item.group._id.toString()] ?? "";

    await Recommendation.findOneAndUpdate(
      { user: currentUser._id, group: item.group._id },
      {
        $set: {
          score:             item.score,
          keywordScore:      item.keywordScore,
          embeddingScore:    item.embeddingScore,
          clusterScore:      item.clusterScore,
          availabilityScore: item.availabilityScore,
          matchedTags:       item.matchedTags,
          aiReasoning:       reason,
        },
        $setOnInsert: { status: "pending" },
      },
      { upsert: true, new: true }
    );

    results.push({ ...item, aiReasoning: reason });
  }

  return res.status(200).json(new ApiResponse(200, results, "AI recommendations generated"));
});

// ── NEW: POST /api/match/recommendations/:recId/action ─────────────
export const actionRecommendation = asyncHandler(async (req, res) => {
  const { recId }  = req.params;
  const { action } = req.body;

  if (!["join", "dismiss"].includes(action)) {
    throw new ApiError(400, "action must be 'join' or 'dismiss'");
  }

  const rec = await Recommendation.findOne({ _id: recId, user: req.user._id });
  if (!rec) throw new ApiError(404, "Recommendation not found");

  if (action === "dismiss") {
    await Recommendation.findByIdAndUpdate(recId, {
      $set: { status: "dismissed", actionedAt: new Date() },
    });
    return res.status(200).json(new ApiResponse(200, {}, "Dismissed"));
  }

  // action = join → use inner join logic
  req.params.groupId = rec.group.toString();
  return joinGroupInner(req, res, async () => {
    await Recommendation.findByIdAndUpdate(recId, {
      $set: { status: "joined", actionedAt: new Date() },
    });
  });
});

// ── Shared join logic ──────────────────────────────────────────────
const joinGroupInner = async (req, res, onSuccess) => {
  const { groupId } = req.params;
  const currentUser = await User.findById(req.user._id);

  if (currentUser.groups.length >= 5)
    throw new ApiError(400, "You can only be in a maximum of 5 groups");

  const group = await Group.findById(groupId);
  if (!group)          throw new ApiError(404, "Group not found");
  if (!group.isActive) throw new ApiError(400, "This group is no longer active");
  if (group.members.includes(currentUser._id))
    throw new ApiError(400, "You are already a member of this group");
  if (group.members.length >= group.maxMembers)
    throw new ApiError(400, "This group is full");

  await Group.findByIdAndUpdate(groupId, { $push: { members: currentUser._id } });
  await User.findByIdAndUpdate(currentUser._id, { $push: { groups: groupId } });
  if (onSuccess) await onSuccess();

  const populated = await Group.findById(groupId)
    .populate("admin",   "fullName username avatar")
    .populate("members", "fullName username avatar subjects interests");

  return res.status(200).json(new ApiResponse(200, populated, "Joined group successfully"));
};

// ── All original endpoints (unchanged) ────────────────────────────
export const getSuggestedMatches = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);
  if (!currentUser.subjects.length && !currentUser.interests.length)
    throw new ApiError(400, "Please update your study profile first");

  const otherUsers = await User.find({ _id: { $ne: currentUser._id } })
    .select("fullName username avatar subjects interests studyGoals availability groups");

  const scoredUsers = otherUsers
    .map((u) => ({
      user: u,
      score:
        currentUser.subjects.filter((s) => u.subjects.includes(s)).length * 2 +
        currentUser.interests.filter((i) => u.interests.includes(i)).length,
    }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((e) => ({ ...e.user.toObject(), matchScore: e.score }));

  const suggestedGroups = await Group.find({
    $or: [{ subjects: { $in: currentUser.subjects } }, { interests: { $in: currentUser.interests } }],
    members:  { $ne: currentUser._id },
    isActive: true,
  })
    .populate("admin",   "fullName username avatar")
    .populate("members", "fullName username avatar")
    .limit(10);

  return res.status(200).json(
    new ApiResponse(200, { suggestedUsers: scoredUsers, suggestedGroups }, "Suggestions fetched")
  );
});

export const createGroup = asyncHandler(async (req, res) => {
  const { name, description, maxMembers, category } = req.body;
  const currentUser = await User.findById(req.user._id);

  if (!name?.trim()) throw new ApiError(400, "Group name is required");
  if (currentUser.groups.length >= 5) throw new ApiError(400, "You can only be in a maximum of 5 groups");

  const existing = await Group.findOne({ name: name.trim() });
  if (existing) throw new ApiError(409, "A group with this name already exists");
  if (!currentUser.subjects.length && !currentUser.interests.length)
    throw new ApiError(400, "Please update your study profile first");

  const embedding = (await getEmbedding(buildProfileText({
    name: name.trim(), description: description?.trim() || "",
    subjects: currentUser.subjects, interests: currentUser.interests,
    studyGoals: currentUser.studyGoals,
  }))) ?? [];

  const group = await Group.create({
    name:         name.trim(),
    description:  description?.trim() || "",
    admin:        currentUser._id,
    members:      [currentUser._id],
    subjects:     currentUser.subjects,
    interests:    currentUser.interests,
    studyGoals:   currentUser.studyGoals,
    availability: currentUser.availability,
    skillTags:    currentUser.skillTags,
    maxMembers:   maxMembers || 10,
    category:     category || "study",
    embedding,
  });

  await User.findByIdAndUpdate(currentUser._id, { $push: { groups: group._id } });

  const populated = await Group.findById(group._id)
    .populate("admin",   "fullName username avatar")
    .populate("members", "fullName username avatar subjects interests");

  return res.status(201).json(new ApiResponse(201, populated, "Group created successfully"));
});

export const joinGroup = asyncHandler(async (req, res) => {
  const after = async () => {
    await Recommendation.findOneAndUpdate(
      { user: req.user._id, group: req.params.groupId, status: "pending" },
      { $set: { status: "joined", actionedAt: new Date() } }
    );
  };
  return joinGroupInner(req, res, after);
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const currentUser = await User.findById(req.user._id);
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  if (!group.members.includes(currentUser._id)) throw new ApiError(400, "You are not a member");

  if (group.admin.toString() === currentUser._id.toString() && group.members.length > 1) {
    const newAdmin = group.members.find((m) => m.toString() !== currentUser._id.toString());
    await Group.findByIdAndUpdate(groupId, { $pull: { members: currentUser._id }, $set: { admin: newAdmin } });
  } else if (group.members.length === 1) {
    await Group.findByIdAndUpdate(groupId, { $pull: { members: currentUser._id }, $set: { isActive: false } });
  } else {
    await Group.findByIdAndUpdate(groupId, { $pull: { members: currentUser._id } });
  }

  await User.findByIdAndUpdate(currentUser._id, { $pull: { groups: groupId } });
  return res.status(200).json(new ApiResponse(200, {}, "Left group successfully"));
});

export const getMyGroups = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "groups",
    populate: [
      { path: "admin",   select: "fullName username avatar" },
      { path: "members", select: "fullName username avatar" },
    ],
  });
  return res.status(200).json(new ApiResponse(200, user.groups, "Groups fetched successfully"));
});

export const updateGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { name, description } = req.body;
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  if (group.admin.toString() !== req.user._id.toString())
    throw new ApiError(403, "Only the group admin can edit group details");
  if (name && name.trim() !== group.name) {
    const existing = await Group.findOne({ name: name.trim() });
    if (existing) throw new ApiError(409, "A group with this name already exists");
  }
  const updated = await Group.findByIdAndUpdate(
    groupId,
    { $set: { ...(name && { name: name.trim() }), ...(description !== undefined && { description: description.trim() }) } },
    { new: true }
  ).populate("admin", "fullName username avatar").populate("members", "fullName username avatar");
  return res.status(200).json(new ApiResponse(200, updated, "Group updated successfully"));
});

export const searchGroups = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) throw new ApiError(400, "Search query is required");
  const groups = await Group.find({ name: { $regex: q.trim(), $options: "i" }, isActive: true })
    .populate("admin", "fullName username avatar")
    .populate("members", "fullName username avatar")
    .limit(20);
  return res.status(200).json(new ApiResponse(200, groups, "Search results"));
});