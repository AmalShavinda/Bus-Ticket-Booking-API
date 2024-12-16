import express from "express";
import {
  createTripSchedule,
  getAllTripSchedules,
  getReservedSeats,
  getTripsForDay,
} from "../controllers/tripSchduleController.js";

const router = express.Router();

router.post("/", createTripSchedule);
router.get("/", getAllTripSchedules);
router.get("/trips", getTripsForDay);
router.get("/reserved-seats", getReservedSeats);

export default router;
