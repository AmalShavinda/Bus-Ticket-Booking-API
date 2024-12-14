import express from "express";
import { createBooking, getAllBookings } from "../controllers/bookingController.js";
import { verifyToken } from "../utils/verifyAdmin.js";

const router = express.Router();

router.post("/", verifyToken, createBooking);
router.get("/", verifyToken, getAllBookings);

export default router;
