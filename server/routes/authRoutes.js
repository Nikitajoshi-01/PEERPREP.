import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/authController.js";
import { upload } from "../middlewares/multerMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// protected routes
router.route("/logout").post(protect, logoutUser);
router.route("/current-user").get(protect, getCurrentUser);
router.route("/update-account").patch(protect, updateAccountDetails);
router.route("/avatar").patch(protect, upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(protect, upload.single("coverImage"), updateUserCoverImage);

export default router;