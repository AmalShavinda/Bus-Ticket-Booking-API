import Bus from "../models/Bus.js";
import Employee from "../models/Employee.js";
import Booking from "../models/Booking.js";

// Create a new trip schedule
export const createTripSchedule = async (req, res) => {
  const {
    busId,
    routeId,
    tripDate,
    isReturnTrip,
    departureTime,
    arrivalTime,
    price,
  } = req.body;

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
      routeId,
      busId,
      tripDate,
      isReturnTrip,
      departureTime,
      arrivalTime,
      price,
      reservedSeats,
    };

    bus.tripSchedules.push(newTripSchedule);
    await bus.save();

    res.status(201).json({
      message: "Trip schedule created",
      tripSchedule: newTripSchedule,
    });
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
    const bus = await Bus.findOne(
      { "tripSchedules.tripId": tripId },
      { "tripSchedules.$": 1 }
    );
    if (!bus)
      return res.status(404).json({ message: "Trip schedule not found" });

    res.status(200).json(bus.tripSchedules[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a trip schedule
export const updateTripSchedule = async (req, res) => {
  const { busId, tripId } = req.params;
  const { routeId, tripDate, isReturnTrip, departureTime, arrivalTime } =
    req.body;

  try {
    const bus = await Bus.findOne({ busId });
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const tripSchedule = bus.tripSchedules.id(tripId);
    if (!tripSchedule)
      return res.status(404).json({ message: "Trip schedule not found" });

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
    const bus = await Bus.findOne({ _id: busId });
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const tripIndex = bus.tripSchedules.findIndex(
      (schedule) => schedule._id.toString() === tripId
    );
    if (tripIndex === -1) {
      return res.status(404).json({ message: "Trip schedule not found" });
    }

    // Remove the trip schedule from the array
    bus.tripSchedules.splice(tripIndex, 1);
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

    const tripSchedule = bus.tripSchedules.find(
      (schedule) => schedule.tripId === tripId
    );
    if (!tripSchedule) throw new Error("Trip schedule not found");

    // Check if seats are already reserved
    const reservedSet = new Set(tripSchedule.reservedSeats);
    const unavailableSeats = seats.filter((seat) => reservedSet.has(seat));
    if (unavailableSeats.length > 0) {
      throw new Error(
        `Seats ${unavailableSeats.join(", ")} are already reserved.`
      );
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

// get trip for a day
export const getTripsForDay = async (req, res) => {
  try {
    const { employeeId, date } = req.query;

    // Validate input
    if (!employeeId || !date) {
      return res.status(400).json({
        message: "Employee ID and date are required",
      });
    }

    // Find the employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Check if the employee is a driver or conductor
    if (!["Driver", "Conductor"].includes(employee.employeePosition)) {
      return res.status(403).json({
        message: "Access denied. Only drivers or conductors can view trips",
      });
    }

    // Find the bus assigned to the employee
    const bus = await Bus.findOne({
      $or: [{ driver: employee._id }, { conductor: employee._id }],
    }).populate({
      path: "tripSchedules.routeId",
      select: "startPoint endDestination", // Include relevant route details
    });

    if (!bus) {
      return res.status(404).json({
        message: "No bus assigned to the employee",
      });
    }

    // Filter trips for the given date
    const tripsForDay = bus.tripSchedules.filter((schedule) => {
      const tripDate = new Date(schedule.tripDate).toISOString().split("T")[0];
      const inputDate = new Date(date).toISOString().split("T")[0];
      return tripDate === inputDate;
    });

    if (tripsForDay.length === 0) {
      return res.status(404).json({
        message: "No trips found for the given date",
      });
    }

    // Format and respond with the trips
    const formattedTrips = tripsForDay.map((trip) => ({
      tripId: trip.tripId,
      route: trip.routeId,
      tripDate: trip.tripDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      isReturnTrip: trip.isReturnTrip,
    }));

    res.status(200).json({
      message: "Trips retrieved successfully",
      trips: formattedTrips,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while fetching trips",
      error: error.message,
    });
  }
};

export const getTripsbyDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    const inputDate = new Date(date).toISOString().split("T")[0];

    // Fetch all buses and filter their tripSchedules
    const busesWithTrips = await Bus.find().populate("tripSchedules.routeId");

    const tripsByDate = busesWithTrips.flatMap((bus) => {
      return bus.tripSchedules
        .filter((schedule) => {
          const tripDate = new Date(schedule.tripDate)
            .toISOString()
            .split("T")[0];
          return tripDate === inputDate;
        })
        .map((trip) => ({
          tripId: trip._id,
          route: trip.routeId, // Route reference populated
          tripDate: trip.tripDate,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          isReturnTrip: trip.isReturnTrip,
          price: trip.price,
          busId: bus._id,
          registrationNumber: bus.registrationNumber,
        }));
    });

    if (tripsByDate.length === 0) {
      return res.status(404).json({
        message: "No trips found for the given date",
      });
    }

    res.status(200).json(tripsByDate);
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while fetching trips",
      error: error.message,
    });
  }
};

export const getReservedSeats = async (req, res) => {
  try {
    const { tripId, employeeId } = req.query;

    // Validate input
    if (!tripId || !employeeId) {
      return res.status(400).json({
        message: "Trip ID and Employee ID are required",
      });
    }

    // Find the bus assigned to the employee
    const bus = await Bus.findOne({
      $or: [{ driver: employeeId }, { conductor: employeeId }],
      "tripSchedules.tripId": tripId,
    }).populate("tripSchedules.routeId", "startPoint endDestination");

    if (!bus) {
      return res.status(404).json({
        message: "No bus or trip found for the given employee and trip ID",
      });
    }

    // Find the specific trip
    const trip = bus.tripSchedules.find(
      (schedule) => schedule.tripId === tripId
    );

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // Extract reserved seats
    const reservedSeats = trip.reservedSeats.filter((seat) => seat.isReserved);

    // Fetch payment details for the reserved seats
    const seatNumbers = reservedSeats.map((seat) => seat.seatNumber);
    const bookings = await Booking.find({
      busId: bus._id,
      tripDate: trip.tripDate,
      seats: { $in: seatNumbers },
    }).select("seats paymentStatus username");

    // Map seat details with payment information
    const reservedSeatsWithPayment = reservedSeats.map((seat) => {
      const booking = bookings.find((b) => b.seats.includes(seat.seatNumber));
      return {
        seatNumber: seat.seatNumber,
        isReserved: seat.isReserved,
        reservedBy: seat.reservedBy,
        bookingDate: seat.bookingDate,
        paymentStatus: booking ? booking.paymentStatus : "Unknown",
        username: booking ? booking.username : "Unknown",
      };
    });

    // Response
    res.status(200).json({
      message: "Reserved seats with payment status retrieved successfully",
      data: {
        busDetails: {
          registrationNumber: bus.registrationNumber,
          model: bus.model,
        },
        tripDetails: {
          route: {
            startPoint: trip.routeId.startPoint.name,
            endDestination: trip.routeId.endDestination.name,
          },
          tripDate: trip.tripDate,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
        },
        reservedSeats: reservedSeatsWithPayment,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while retrieving reserved seats",
      error: error.message,
    });
  }
};
