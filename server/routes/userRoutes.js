import { Router } from "express";
import { updateStudyProfile, getUserProfile } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/study-profile").patch(protect, updateStudyProfile);
router.route("/profile/:username").get(protect, getUserProfile);

export default router;