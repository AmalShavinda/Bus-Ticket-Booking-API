import express from "express";
import {
  deleteUser,
  getAllUsers,
  updateUser,
} from "../controllers/userController.js";
import { verifyAdmin } from "../utils/verifyAdmin.js";

const router = express.Router();

router.get("/", verifyAdmin, getAllUsers);
router.put("/:id", verifyAdmin, updateUser);
router.delete("/:id", verifyAdmin, deleteUser);

export default router;
