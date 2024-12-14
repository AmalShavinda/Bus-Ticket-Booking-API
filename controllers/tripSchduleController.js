import Bus from "../models/Bus.js";
import { v4 as uuidv4 } from "uuid";

// Create a new trip schedule
export const createTripSchedule = async (req, res) => {
  const { busId, routeId, tripDate, isReturnTrip, departureTime, arrivalTime } = req.body;

  try {
    // Fetch bus details to get seat capacity
    const bus = await Bus.findOne({ _id: busId });
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const seatCapacity = bus.seatCapacity;

    // Initialize all seats as available
    const reservedSeats = [];
    for (let i = 1; i <= seatCapacity; i++) {
      reservedSeats.push({ seatNumber: i, isReserved: false });
    }

    // Create new trip schedule
    const newTripSchedule = {
      tripId: uuidv4(),
      routeId,
      busId,
      tripDate,
      isReturnTrip,
      departureTime,
      arrivalTime,
      reservedSeats,
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
    const tripSchedules = buses.flatMap((bus) => bus.tripSchedules);
    res.status(200).json(tripSchedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific trip schedule
export const getTripScheduleById = async (req, res) => {
  const { tripId } = req.params;

  try {
    const bus = await Bus.findOne({ "tripSchedules.tripId": tripId }, { "tripSchedules.$": 1 });
    if (!bus) return res.status(404).json({ message: "Trip schedule not found" });

    res.status(200).json(bus.tripSchedules[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a trip schedule
export const updateTripSchedule = async (req, res) => {
  const { busId, tripId } = req.params;
  const { routeId, tripDate, isReturnTrip, departureTime, arrivalTime } = req.body;

  try {
    const bus = await Bus.findOne({ busId });
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const tripSchedule = bus.tripSchedules.id(tripId);
    if (!tripSchedule) return res.status(404).json({ message: "Trip schedule not found" });

    // Update trip details
    if (routeId) tripSchedule.routeId = routeId;
    if (tripDate) tripSchedule.tripDate = tripDate;
    if (isReturnTrip !== undefined) tripSchedule.isReturnTrip = isReturnTrip;
    if (departureTime) tripSchedule.departureTime = departureTime;
    if (arrivalTime) tripSchedule.arrivalTime = arrivalTime;

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
    const bus = await Bus.findOne({ busId });
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const tripSchedule = bus.tripSchedules.id(tripId);
    if (!tripSchedule) return res.status(404).json({ message: "Trip schedule not found" });

    tripSchedule.remove();
    await bus.save();

    res.status(200).json({ message: "Trip schedule deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSeatsAfterBooking = async (tripId, seats) => {
  try {
    const bus = await Bus.findOne({ "tripSchedules.tripId": tripId });
    if (!bus) throw new Error("Trip not found");

    const tripSchedule = bus.tripSchedules.find(schedule => schedule.tripId === tripId);
    if (!tripSchedule) throw new Error("Trip schedule not found");

    // Check if seats are already reserved
    const reservedSet = new Set(tripSchedule.reservedSeats);
    const unavailableSeats = seats.filter(seat => reservedSet.has(seat));
    if (unavailableSeats.length > 0) {
      throw new Error(`Seats ${unavailableSeats.join(", ")} are already reserved.`);
    }

    // Update seat reservations
    tripSchedule.reservedSeats.push(...seats);
    tripSchedule.availableSeats -= seats.length;

    await bus.save();
    return tripSchedule;
  } catch (error) {
    throw new Error(error.message);
  }
};

