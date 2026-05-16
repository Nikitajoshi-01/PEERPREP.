import { Router } from "express";
import { requestMatch, getMyGroup, leaveGroup } from "../controllers/matchController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/request").post(protect, requestMatch);
router.route("/my-group").get(protect, getMyGroup);
router.route("/leave").post(protect, leaveGroup);

export default router;