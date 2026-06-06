import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }     from "../utils/ApiError.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import { Group }        from "../models/Group.js";
import { User }         from "../models/User.js";
import { getAIReply }   from "../utils/geminiAI.js";

// POST /api/ai/ask
export const askAI = asyncHandler(async (req, res) => {
  const { groupId, question, history } = req.body;

  if (!question?.trim()) throw new ApiError(400, "Question is required");

  // verify group exists and user is a member
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  const isMember = group.members.some(
    (m) => m.toString() === req.user._id.toString()
  );
  if (!isMember) throw new ApiError(403, "You are not a member of this group");

  const user = await User.findById(req.user._id).select("fullName username");

  const answer = await getAIReply({
    question: question.trim(),
    group,
    username: user.fullName,
    history:  history || [],
  });

  return res.status(200).json(
    new ApiResponse(200, { answer, question: question.trim() }, "AI response")
  );
});