import express from "express";
import {
  createTripSchedule,
  deleteTripSchedule,
  getAllTripSchedules,
  getReservedSeats,
  getTripsbyDate,
  getTripsForDay,
} from "../controllers/tripSchduleController.js";
import { verifyAdmin, verifyToken } from "../utils/verifyAdmin.js";

const router = express.Router();

router.post("/", verifyAdmin, createTripSchedule);
router.get("/", verifyToken, getAllTripSchedules);
router.get("/trips", verifyToken, getTripsForDay);
router.get("/reserved-seats", verifyToken, getReservedSeats);
router.get("/date", verifyToken, getTripsbyDate);
router.delete("/buses/:busId/trips/:tripId", verifyAdmin, deleteTripSchedule);

export default router;
