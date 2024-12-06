import Bus from "../models/Bus.js"; // Assuming Bus schema includes trip schedules
import { v4 as uuidv4 } from "uuid";

// Create a new trip schedule
export const createTripSchedule = async (req, res) => {
  const { busId, routeId, departureTime, arrivalTime } = req.body;

  try {
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const newTripSchedule = {
      tripId: uuidv4(),
      routeId,
      departureTime,
      arrivalTime,
      reservedSeats: [],
      availableSeats: bus.seatCapacity,
    };

    bus.tripSchedules.push(newTripSchedule);
    await bus.save();

    res.status(201).json({ message: "Trip schedule created", tripSchedule: newTripSchedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all trip schedules
export const getAllTripSchedules = async (req, res) => {
  try {
    const buses = await Bus.find().select("tripSchedules");
    res.status(200).json(buses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a trip schedule
export const updateTripSchedule = async (req, res) => {
  const { busId, tripId } = req.params;
  const { departureTime, arrivalTime } = req.body;

  try {
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const tripSchedule = bus.tripSchedules.id(tripId);
    if (!tripSchedule) return res.status(404).json({ message: "Trip schedule not found" });

    tripSchedule.departureTime = departureTime || tripSchedule.departureTime;
    tripSchedule.arrivalTime = arrivalTime || tripSchedule.arrivalTime;

    await bus.save();
    res.status(200).json({ message: "Trip schedule updated", tripSchedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a trip schedule
export const deleteTripSchedule = async (req, res) => {
  const { busId, tripId } = req.params;

  try {
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    bus.tripSchedules.id(tripId).remove();
    await bus.save();

    res.status(200).json({ message: "Trip schedule deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
