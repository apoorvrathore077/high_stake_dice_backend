import express from "express";
import userController from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();
userRouter.post("/signup",userController.signup);
userRouter.post("/login",userController.login);
userRouter.get("/profile",authMiddleware,userController.getProfile);

export default userRouter;
