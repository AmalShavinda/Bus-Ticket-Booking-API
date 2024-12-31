import express from "express";
import {
  cancelBooking,
  createBooking,
  getAllBookings,
  getBookingsByBusIdAndTripDate,
  getBookingsByUserId,
} from "../controllers/bookingController.js";
import { verifyToken } from "../utils/verifyAdmin.js";

const router = express.Router();

router.post("/", verifyToken, createBooking);
router.get("/", verifyToken, getAllBookings);
router.get("/:userId", verifyToken, getBookingsByUserId);
router.patch("/:bookingId", verifyToken, cancelBooking);
router.get("/bus/:busId", verifyToken, getBookingsByBusIdAndTripDate);

export default router;
