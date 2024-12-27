import express from "express";
import { verifyAdmin, verifyToken } from "../utils/verifyAdmin.js";
import {
  createRoute,
  deleteRoute,
  getAllRoutes,
  updateRoute,
} from "../controllers/routeController.js";

const router = express.Router();

router.post("/", verifyAdmin, createRoute);
router.put("/:id", verifyAdmin, updateRoute);
router.delete("/:id", verifyAdmin, deleteRoute);
router.get("/", verifyToken, getAllRoutes);

export default router;
