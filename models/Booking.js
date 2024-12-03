import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: [true, "Booking ID is required"],
      trim: true,
    },
    busId: {
      type: String,
      required: [true, "Bus ID is required"],
      trim: true,
    },
    routeId: {
      type: String,
      required: [true, "Route ID is required"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Booking ID is required"],
      trim: true,
    },
    seats: {
      type: [Number], // Array of seat numbers
      required: true,
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "At least one seat must be booked",
      },
    },
    totalSeats: {
      type: Number,
      required: true,
      default: function () {
        return this.seats.length;
      },
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    paymentDetails: {
      amount: {
        type: Number,
        required: false,
      },
      transactionId: {
        type: String,
        required: false,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", BookingSchema);
