import express from "express";
const router = express.Router();
import { getDashboardStats } from "../controllers/statisticController.js";

router.get("/", getDashboardStats);

export default router;
