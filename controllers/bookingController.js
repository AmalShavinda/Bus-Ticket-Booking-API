import Booking from "../models/Booking.js";

export const createBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    // Check for existing bus by unique fields
    const existingBooking = await Booking.findOne({
      bookingId,
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "Booking ID already exists",
      });
    }

    const newBooking = new Booking(req.body);

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message, // Send the validation error message
      });
    }
    next(error);
  }
};
