import Bus from "../models/Bus.js";
import Route from "../models/Route.js";

export const createBus = async (req, res, next) => {
  try {
    const { registrationNumber } = req.body;

    // Check for existing bus by unique fields
    const existingBus = await Bus.findOne({
      registrationNumber,
    });

    if (existingBus) {
      return res.status(400).json({
        message: "Registration Number already exists",
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

export const searchAvailableBuses = async (req, res, next) => {
  try {
    const { startPoint, destination, date } = req.query;

    // Validate input
    if (!startPoint || !destination || !date) {
      return res
        .status(400)
        .json({ message: "Start point, destination, and date are required" });
    }

    // Step 1: Find matching routes
    const matchingRoutes = await Route.find({
      $or: [
        // Check if startPoint and destination match directly
        {
          "startPoint.name": { $regex: new RegExp(startPoint, "i") },
          "endDestination.name": { $regex: new RegExp(destination, "i") },
        },
        // Check if startPoint matches any substation and destination matches the endpoint
        {
          "subStations.name": { $regex: new RegExp(startPoint, "i") },
          "endDestination.name": { $regex: new RegExp(destination, "i") },
        },
        // Check if startPoint matches the startPoint and destination matches any substation
        {
          "startPoint.name": { $regex: new RegExp(startPoint, "i") },
          "subStations.name": { $regex: new RegExp(destination, "i") },
        },
      ],
    });

    if (!matchingRoutes.length) {
      return res.status(404).json({
        message: "No routes found for the given start point and destination",
      });
    }

    const routeIds = matchingRoutes.map((route) => route._id);

    // Step 2: Find buses with trip schedules matching the routes and date
    const buses = await Bus.find({
      "tripSchedules.routeId": { $in: routeIds },
      "tripSchedules.tripDate": new Date(date),
    }).populate("tripSchedules.routeId");

    if (!buses.length) {
      return res.status(404).json({
        message: "No buses found for the given date and route",
      });
    }

    // Step 3: Prepare response with matching buses and trip schedules
    const availableBuses = buses.map((bus) => ({
      busId: bus._id,
      busNumber: bus.registrationNumber,
      seatCapacity: bus.seatCapacity,
      tripSchedules: bus.tripSchedules
        .filter((schedule) => {
          // Extract only the date part (YYYY-MM-DD) from both the schedule date and input date
          const scheduleDate = new Date(schedule.tripDate)
            .toISOString()
            .split("T")[0];
          const inputDate = new Date(date).toISOString().split("T")[0];

          // Return schedules that match the input date
          return scheduleDate === inputDate;
        })
        .map((schedule) => ({
          tripId: schedule._id, // Use schedule._id as the tripId
          route: schedule.routeId, // Include routeId for reference
          tripDate: schedule.tripDate,
          departureTime: schedule.departureTime,
          arrivalTime: schedule.arrivalTime,
          reservedSeats: schedule.reservedSeats
            .filter((seat) => seat.isReserved) // Only include reserved seats
            .map((seat) => ({
              seatNumber: seat.seatNumber,
              reservedBy: seat.reservedBy,
              bookingDate: seat.bookingDate,
              _id: seat._id,
            })),
        })),
    }));

    res.status(200).json({
      message: "Available buses retrieved successfully",
      data: availableBuses,
    });
  } catch (error) {
    next(error);
  }
};

export const getSeatsForTrip = async (req, res, next) => {
  try {
    const { tripId } = req.query;

    // Validate input
    if (!tripId) {
      return res.status(400).json({ message: "Trip ID is required" });
    }

    // Step 1: Find the bus containing the trip schedule with the given tripId
    const bus = await Bus.findOne({ "tripSchedules._id": tripId });

    if (!bus) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Step 2: Find the specific trip schedule using the tripId
    const tripSchedule = bus.tripSchedules.find(
      (schedule) => schedule._id.toString() === tripId
    );

    if (!tripSchedule) {
      return res.status(404).json({ message: "Trip schedule not found" });
    }

    // Step 3: Prepare response with trip details and all seats
    const response = {
      tripId: tripSchedule._id,
      route: tripSchedule.routeId,
      price: tripSchedule.price,
      tripDate: tripSchedule.tripDate,
      departureTime: tripSchedule.departureTime,
      arrivalTime: tripSchedule.arrivalTime,
      seats: tripSchedule.reservedSeats.map((seat) => ({
        seatNumber: seat.seatNumber,
        isReserved: seat.isReserved,
        reservedBy: seat.reservedBy,
        bookingDate: seat.bookingDate,
        _id: seat._id,
      })),
    };

    res.status(200).json({
      message: "Seats retrieved successfully",
      data: response,
    });
  } catch (error) {
    next(error);
  }
};
