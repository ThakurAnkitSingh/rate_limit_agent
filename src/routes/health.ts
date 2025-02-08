import express from "express";
import { healthCheckController } from "../controllers/healthController";

const router = express.Router();

router.get("/health", healthCheckController.basic);
router.get("/health/detailed", healthCheckController.detailed);

export default router;
