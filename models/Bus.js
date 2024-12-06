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
});

const TripScheduleSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    unique: true,
  },
  routeId: {
    type: String,
    required: true,
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
    default: [],
  },
  availableSeats: {
    type: Number,
    default: function () {
      return this.reservedSeats.length
        ? this.bus.seatCapacity - this.reservedSeats.length
        : this.bus.seatCapacity;
    },
  },
});

const BusSchema = new mongoose.Schema(
  {
    busId: {
      type: String,
      unique: true,
      required: [true, "Bus ID is required"],
      trim: true,
    },
    routeId: {
      type: String,
      required: [true, "Route ID is required"],
      trim: true,
    },
    registrationNumber: {
      type: String,
      unique: true,
      required: [true, "Registration number is required"],
      trim: true,
    },
    chassisNumber: {
      type: String,
      unique: true,
      required: [true, "Chassis number is required"],
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
      type: String,
      required: [true, "Driver is required"],
      trim: true,
    },
    conductor: {
      type: String,
      required: [true, "Conductor is required"],
      trim: true,
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
