import mongoose from "mongoose";

const SeatSchema = new mongoose.Schema({
  seatNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  isReserved: {
    type: Boolean,
    default: false,
  },
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References the user who booked the seat
    default: null,
  },
  bookingDate: {
    type: Date,
    default: null,
  },
});

const TripScheduleSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    unique: true,
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    required: true,
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true,
  },
  tripDate: {
    type: Date,
    required: true, // Links the trip to a specific day
  },
  isReturnTrip: {
    type: Boolean,
    default: false, // Indicates if it's a return trip
  },
  departureTime: {
    type: Date,
    required: true,
  },
  arrivalTime: {
    type: Date,
    required: true,
  },
  reservedSeats: {
    type: [SeatSchema],
    default: function () {
      // Initialize seats with all seats as not reserved
      const seats = [];
      for (let i = 1; i <= this.seatCapacity; i++) {
        seats.push({ seatNumber: i });
      }
      return seats;
    },
  },
});

const BusSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      unique: true,
      required: [true, "Registration number is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },
    seatCapacity: {
      type: Number,
      required: [true, "Seat capacity is required"],
      min: [1, "Seat capacity must be at least 1"],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // Reference to the driver
      required: true,
    },
    conductor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // Reference to the conductor
      required: true,
    },
    owner: {
      type: String,
      required: [true, "Owner is required"],
      trim: true,
    },
    tripSchedules: {
      type: [TripScheduleSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bus", BusSchema);
