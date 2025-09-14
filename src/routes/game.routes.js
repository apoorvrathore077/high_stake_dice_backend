import express from "express";
import gameController from "../controllers/game.controllers.js";

const gameRoutes = express.Router();
gameRoutes.post("/placeBet", gameController.placeBet);
export default gameRoutes;