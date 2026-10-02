const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeSelf } = require("../middleware/authorizeMiddleware");

const userRouter = express.Router();

userRouter.post("/signup", userController.signup);
userRouter.post("/login", userController.login);

userRouter.get("/allUsers", authMiddleware, userController.getAllUsers);
userRouter.get("/userProfile/:id", authMiddleware, userController.getUserProfile);
userRouter.put("/updateProfile/:id", authMiddleware, authorizeSelf, userController.updateUserProfile);
userRouter.delete("/deleteProfile/:id", authMiddleware, authorizeSelf, userController.deleteUserProfile);

module.exports = userRouter;
