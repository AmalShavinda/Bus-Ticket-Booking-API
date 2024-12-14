import Booking from "../models/Booking.js";
import Bus from "../models/Bus.js";
import { v4 as uuidv4 } from "uuid";

// Create a new booking
export const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { busId, routeId, username, seats, tripDate, paymentDetails } = req.body;

    // Validate bus
    const bus = await Bus.findById(busId).session(session);
    if (!bus) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bus not found" });
    }

    // Find the trip schedule
    const tripSchedule = bus.tripSchedules.find(schedule =>
      schedule.routeId.toString() === routeId &&
      schedule.tripDate.toISOString() === new Date(tripDate).toISOString()
    );

    if (!tripSchedule) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Trip schedule not found" });
    }

    // Check seat availability
    const reservedSet = new Set(tripSchedule.reservedSeats);
    const unavailableSeats = seats.filter(seat => reservedSet.has(seat));
    if (unavailableSeats.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Seats ${unavailableSeats.join(", ")} are already reserved`,
      });
    }

    // Update trip schedule seats
    tripSchedule.reservedSeats.push(...seats);
    tripSchedule.availableSeats -= seats.length;

    // Save the bus document
    await bus.save({ session });

    // Create a booking
    const booking = new Booking({
      bookingId: uuidv4(),
      busId,
      routeId,
      username,
      seats,
      tripDate,
      totalSeats: seats.length,
      paymentDetails,
      paymentStatus: paymentDetails ? "Completed" : "Pending",
    });

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Get all bookings
export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

// Get a booking by ID
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("busId routeId username");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
};

// Update a booking
export const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedBooking = await Booking.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("busId routeId username");

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking updated successfully", booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

// Delete a booking
export const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Release the seats from the bus schedule
    const bus = await Bus.findById(booking.busId);
    if (bus) {
      bus.tripSchedules.forEach(schedule => {
        if (schedule.routeId.toString() === booking.routeId.toString() && schedule.tripDate.toISOString() === booking.tripDate.toISOString()) {
          schedule.reservedSeats = schedule.reservedSeats.filter(seat => !booking.seats.includes(seat));
          schedule.availableSeats += booking.seats.length;
        }
      });
      await bus.save();
    }

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    next(error);
  }
};
