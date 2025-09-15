import express from "express";
import gameController from "../controllers/game.controllers.js";
import authMiddleware from "../middleware/auth.js";

const gameRoutes = express.Router();
gameRoutes.post("/placeBet", gameController.placeBet);
gameRoutes.get("/getGame",authMiddleware,gameController.getGameHistory);
gameRoutes.get("/getUserStatus",authMiddleware,gameController.getUserStats);
export default gameRoutes;