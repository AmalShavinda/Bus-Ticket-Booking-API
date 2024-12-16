import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: [true, "Bus ID is required"],
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: [true, "Route ID is required"],
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TripSchedule", // Reference to TripSchedule model
      required: [true, "Trip ID is required"],
    },
    username: {
      type: String,
      ref: "User",
      required: [true, "Username is required"],
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
    tripDate: {
      type: Date,
      required: [true, "Trip date is required"],
    },
    paymentDetails: {
      amount: {
        type: Number,
        required: function () {
          return this.paymentStatus === "Completed";
        },
        min: [0, "Amount must be a positive number"],
      },
      transactionId: {
        type: String,
        required: function () {
          return this.paymentStatus === "Completed";
        },
      },
      paymentMethod: {
        type: String,
        enum: ["Credit Card", "Debit Card", "Cash", "Online Banking"],
        required: function () {
          return this.paymentStatus === "Completed";
        },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", BookingSchema);
