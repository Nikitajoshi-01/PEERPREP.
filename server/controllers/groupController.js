import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/Message.js";
import { Group } from "../models/Group.js";

// ─── GET GROUP MESSAGES ───────────────────────────────────────────
const getGroupMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  // make sure requester is a member
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  const isMember = group.members.some(
    (m) => m.toString() === req.user._id.toString()
  );
  if (!isMember) throw new ApiError(403, "You are not a member of this group");

  const messages = await Message.find({ groupId })
    .populate("sender", "fullName username avatar")
    .sort({ createdAt: 1 }); // oldest first

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

export { getGroupMessages };