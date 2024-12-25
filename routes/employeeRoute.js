import express from "express";
import { verifyAdmin, verifyToken } from "../utils/verifyAdmin.js";
import {
  createEmployee,
  deleteEmployee,
  getAllConductors,
  getAllDrivers,
  // employeeLogin,
  getAllEmployees,
  updateEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

// router.post("/login", employeeLogin);
router.post("/", verifyAdmin, createEmployee);
router.put("/:id", verifyAdmin, updateEmployee);
router.delete("/:id", verifyAdmin, deleteEmployee);
router.get("/", verifyAdmin, getAllEmployees);
router.get("/drivers", verifyAdmin, getAllDrivers);
router.get("/conductors", verifyAdmin, getAllConductors);

export default router;
