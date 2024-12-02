import Bus from "../models/Bus.js";

export const createBus = async (req, res, next) => {
  try {
    const { busId, registrationNumber, chassisNumber } = req.body;

    // Check for existing bus by unique fields
    const existingBus = await Bus.findOne({
      $or: [{ busId }, { registrationNumber }, { chassisNumber }],
    });

    if (existingBus) {
      return res.status(400).json({
        message:
          "Bus ID, Registration Number, or Chassis Number already exists",
      });
    }

    const newBus = new Bus(req.body);
    await newBus.save();
    res.status(201).json(newBus);
  } catch (error) {
    next(error);
  }
};

export const updateBus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update the bus by ID
    const updatedBus = await Bus.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.status(200).json(updatedBus);
  } catch (error) {
    next(error);
  }
};

export const deleteBus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find and delete the bus by ID
    const deletedBus = await Bus.findByIdAndDelete(id);

    if (!deletedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.status(200).json({ message: "Bus deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAllBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find();
    res.status(200).json(buses);
  } catch (error) {
    next(error);
  }
};
