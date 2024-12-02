import express from "express";
import { verifyAdmin, verifyToken } from "../utils/verifyAdmin.js";
import {
  createEmployee,
  deleteEmployee,
  getAllEmployees,
  updateEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

router.post("/", verifyAdmin, createEmployee);
router.put("/:id", verifyAdmin, updateEmployee);
router.delete("/:id", verifyAdmin, deleteEmployee);
router.get("/", verifyToken, getAllEmployees);

export default router;
