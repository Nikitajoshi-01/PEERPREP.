import { Router } from "express";
import { getGroupMessages } from "../controllers/groupController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/:groupId/messages").get(protect, getGroupMessages);

export default router;