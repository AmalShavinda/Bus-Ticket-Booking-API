import Employee from "../models/Employee.js";

export const createEmployee = async (req, res, next) => {
  try {
    const { username } = req.body;

    // Check for existing bus by unique fields
    const existingEmployee = await Employee.findOne({
      username,
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
    // Use populate to retrieve the registeredNumber field from the Bus model
    const employees = await Employee.find().populate({
      path: "assignedBus", // The field in Employee schema that references Bus
      select: "registrationNumber", // Only fetch the registeredNumber from the Bus model
    });

    res.status(200).json(employees);
  } catch (error) {
    next(error);
  }
};

export const getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await Employee.find({ employeePosition: "Driver" });
    res.status(200).json(drivers);
  } catch (error) {
    next(error);
  }
};

export const getAllConductors = async (req, res, next) => {
  try {
    const conductors = await Employee.find({ employeePosition: "Conductor" });
    res.status(200).json(conductors);
  } catch (error) {
    next(error);
  }
};
