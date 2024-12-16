import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Bus from "../models/Bus.js";

// Create a new booking
export const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { busId, routeId, username, seats, tripDate, paymentDetails } = req.body;

    // Validate bus
    const bus = await Bus.findById(busId).populate('tripSchedules').session(session);
    if (!bus) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bus not found" });
    }

    // Find the trip schedule
    const tripSchedule = bus.tripSchedules.find(schedule =>
      schedule.routeId.toString() === routeId &&
      new Date(schedule.tripDate).toISOString() === new Date(tripDate).toISOString()
    );

    if (!tripSchedule) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Trip schedule not found" });
    }

    // Check seat availability
    const unavailableSeats = tripSchedule.reservedSeats.filter(
      seat => seats.includes(seat.seatNumber) && seat.isReserved
    );
    if (unavailableSeats.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Seats ${unavailableSeats.map(seat => seat.seatNumber).join(", ")} are already reserved`,
      });
    }

    // Update reservedSeats
    tripSchedule.reservedSeats.forEach(seat => {
      if (seats.includes(seat.seatNumber)) {
        seat.isReserved = true;
        seat.reservedBy = req.user._id; // Assuming `req.user` contains the authenticated user's data
        seat.bookingDate = new Date();
      }
    });

    // Save the updated bus
    await bus.save({ session });

    // Create booking
    const booking = new Booking({
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

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params; // Booking ID from request parameters

    // Step 1: Find the booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Step 2: Find the bus with the relevant trip schedule
    const bus = await Bus.findOne({ "tripSchedules._id": booking.tripId });

    if (!bus) {
      return res.status(404).json({ message: "Trip not found for the booking" });
    }

    console.log(bus)

    // Step 3: Update reserved seats in the trip schedule
    const tripSchedule = bus.tripSchedules.find(
      (schedule) => schedule._id === booking.tripId
    );

    if (!tripSchedule) {
      return res.status(404).json({ message: "Trip schedule not found" });
    }

    // Mark seats as available
    booking.seats.forEach((seatNumber) => {
      const seat = tripSchedule.reservedSeats.find(
        (s) => s.seatNumber === seatNumber
      );
      if (seat) {
        seat.isReserved = false;
        seat.reservedBy = null;
        seat.bookingDate = null;
      }
    });

    // Save updated bus document
    await bus.save();

    // Step 4: Mark booking as cancelled
    booking.paymentStatus = "Cancelled";
    await booking.save();

    // Respond with success
    res.status(200).json({
      message: "Booking cancelled successfully and seats are now available",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
