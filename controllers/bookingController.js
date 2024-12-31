import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Bus from "../models/Bus.js";

// Create a new booking
export const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { busId, routeId, tripId, userId, seats, tripDate, paymentDetails } =
      req.body;

    // Validate bus
    const bus = await Bus.findById(busId)
      .populate("tripSchedules")
      .session(session);
    if (!bus) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bus not found" });
    }

    // Find the trip schedule
    const tripSchedule = bus.tripSchedules.find(
      (schedule) =>
        schedule._id.toString() === tripId && // Compare trip ID
        new Date(schedule.tripDate).toISOString() ===
          new Date(tripDate).toISOString() // Compare trip dates
    );

    if (!tripSchedule) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Trip schedule not found" });
    }

    // Check seat availability
    const unavailableSeats = tripSchedule.reservedSeats.filter(
      (seat) => seats.includes(seat.seatNumber) && seat.isReserved
    );
    if (unavailableSeats.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Seats ${unavailableSeats
          .map((seat) => seat.seatNumber)
          .join(", ")} are already reserved`,
      });
    }

    // Update reservedSeats in the trip schedule
    tripSchedule.reservedSeats.forEach((seat) => {
      if (seats.includes(seat.seatNumber)) {
        seat.isReserved = true;
        seat.reservedBy = req.user._id; // Assuming `req.user` contains the authenticated user's data
        seat.bookingDate = new Date();
      }
    });

    // Save the updated bus document
    await bus.save({ session });

    // Create the booking document
    const booking = new Booking({
      busId,
      routeId,
      tripId,
      userId,
      seats,
      tripDate,
      totalSeats: seats.length,
      paymentDetails: paymentDetails
        ? {
            amount: paymentDetails.amount,
            transactionId: paymentDetails.transactionId,
            paymentMethod: paymentDetails.paymentMethod,
          }
        : undefined,
      paymentStatus: paymentDetails ? "Completed" : "Pending",
    });

    // Save the booking to the database
    await booking.save({ session });

    // Commit the transaction and end the session
    await session.commitTransaction();
    session.endSession();

    // Send a success response
    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    // Roll back the transaction on error
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Get all bookings
export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate([
      {
        path: "busId",
        select: "registrationNumber",
      },
      {
        path: "routeId",
        select: "startPoint.name endDestination.name",
      },
      {
        path: "userId",
        select: "firstname",
      },
    ]);
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

// Get a booking by ID
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate(
      "busId routeId username"
    );
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

    res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
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
      bus.tripSchedules.forEach((schedule) => {
        if (
          schedule.routeId.toString() === booking.routeId.toString() &&
          schedule.tripDate.toISOString() === booking.tripDate.toISOString()
        ) {
          schedule.reservedSeats = schedule.reservedSeats.filter(
            (seat) => !booking.seats.includes(seat)
          );
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
      return res
        .status(404)
        .json({ message: "Trip not found for the booking" });
    }

    console.log(bus);

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

export const getBookingsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Fetch all bookings for the given userId and populate the necessary fields
    const bookings = await Booking.find({ userId }).populate([
      {
        path: "busId",
        select: "registrationNumber model", // Fetch specific fields from the bus document
      },
      {
        path: "routeId",
        select: "startPoint.name endDestination.name", // Fetch specific fields from the route document
      },
    ]);

    if (bookings.length === 0)
      return res
        .status(404)
        .json({ message: "No bookings found for this user" });

    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

export const getBookingsByBusIdAndTripDate = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const { tripDate } = req.query; // Extract tripDate from query parameters

    // Build the query object
    const query = { busId };
    if (tripDate) {
      const startOfDay = new Date(tripDate);
      startOfDay.setHours(0, 0, 0, 0); // Start of the day
      const endOfDay = new Date(tripDate);
      endOfDay.setHours(23, 59, 59, 999); // End of the day

      query.tripDate = { $gte: startOfDay, $lte: endOfDay }; // Filter by tripDate
    }

    // Fetch all bookings matching the query and populate the necessary fields
    const bookings = await Booking.find(query).populate([
      {
        path: "userId",
        select: "firstname username email", // Fetch specific fields from the user document
      },
      {
        path: "routeId",
        select: "startPoint.name endDestination.name", // Fetch specific fields from the route document
      },
    ]);

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ message: "No bookings found for this bus and trip date" });
    }

    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};






