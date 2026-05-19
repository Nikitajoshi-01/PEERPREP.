import { Router } from "express";
import {
  getSuggestedMatches,
  createGroup,
  joinGroup,
  leaveGroup,
  getMyGroups,
  updateGroup,
  searchGroups,
} from "../controllers/matchController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/suggestions").get(protect, getSuggestedMatches);
router.route("/groups").get(protect, getMyGroups);
router.route("/groups/search").get(protect, searchGroups);
router.route("/groups/create").post(protect, createGroup);
router.route("/groups/:groupId/join").post(protect, joinGroup);
router.route("/groups/:groupId/leave").post(protect, leaveGroup);
router.route("/groups/:groupId/update").patch(protect, updateGroup);

export default router;