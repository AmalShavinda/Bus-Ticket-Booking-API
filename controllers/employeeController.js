import Employee from "../models/Employee.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const employeeLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const employee = await Employee.findOne({ username });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: employee._id, role: "employee" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ token, role: "employee", employee });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const { employeeId, username } = req.body;

    // Check for existing bus by unique fields
    const existingEmployee = await Employee.findOne({
      $or: [{ employeeId }, { username }],
    });

    if (existingEmployee) {
      return res.status(400).json({
        message: "Employee already exists",
      });
    }

    const newEmployee = new Employee(req.body);

    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message, // Send the validation error message
      });
    }
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update the employee by ID
    const updatedEmployee = await Employee.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(updatedEmployee);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message, // Send the validation error message
      });
    }
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find and delete the employee by ID
    const deletedEmployee = await Employee.findByIdAndDelete(id);

    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAllEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    next(error);
  }
};
