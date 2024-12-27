import express from "express";
import {
  cancelBooking,
  createBooking,
  getAllBookings,
} from "../controllers/bookingController.js";
import { verifyToken } from "../utils/verifyAdmin.js";

const router = express.Router();

router.post("/", verifyToken, createBooking);
router.get("/", verifyToken, getAllBookings);
router.delete("/:bookingId", verifyToken, cancelBooking);

export default router;
