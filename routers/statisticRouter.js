import { Router } from "express";
const router = Router();
import statisticController from "../controllers/statisticController.js";
const { getDashboardStats } = statisticController;

router.get("/", getDashboardStats);

export default router;
