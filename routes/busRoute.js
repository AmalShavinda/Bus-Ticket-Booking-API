import express from "express";
import {
  createBus,
  deleteBus,
  getAllBuses,
  updateBus,
} from "../controllers/busesController.js";
import { verifyAdmin, verifyToken } from "../utils/verifyAdmin.js";

const router = express.Router();

router.post("/buses", verifyAdmin, createBus);
router.put("/buses/:id", verifyAdmin, updateBus);
router.delete("/buses/:id", verifyAdmin, deleteBus);
router.get("/buses/", verifyToken, getAllBuses);

export default router;
