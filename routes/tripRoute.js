import express from "express";
import {
  createTripSchedule,
  getAllTripSchedules,
} from "../controllers/tripSchduleController.js";

const router = express.Router();

router.post("/", createTripSchedule);
router.get("/", getAllTripSchedules);

export default router;
