import mongoose from "mongoose";

const SubStationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "SubStation name is required"],
  },
  latitude: {
    type: Number,
    required: [true, "Latitude is required"],
    min: [-90, "Latitude must be between -90 and 90"],
    max: [90, "Latitude must be between -90 and 90"],
  },
  longitude: {
    type: Number,
    required: [true, "Longitude is required"],
    min: [-180, "Longitude must be between -180 and 180"],
    max: [180, "Longitude must be between -180 and 180"],
  },
});

const RouteSchema = new mongoose.Schema(
  {
    startPoint: {
      name: {
        type: String,
        required: [true, "Start point name is required"],
      },
      latitude: {
        type: Number,
        required: [true, "Start point latitude is required"],
        min: [-90, "Latitude must be between -90 and 90"],
        max: [90, "Latitude must be between -90 and 90"],
      },
      longitude: {
        type: Number,
        required: [true, "Start point longitude is required"],
        min: [-180, "Longitude must be between -180 and 180"],
        max: [180, "Longitude must be between -180 and 180"],
      },
    },
    endDestination: {
      name: {
        type: String,
        required: [true, "End destination name is required"],
      },
      latitude: {
        type: Number,
        required: [true, "End destination latitude is required"],
        min: [-90, "Latitude must be between -90 and 90"],
        max: [90, "Latitude must be between -90 and 90"],
      },
      longitude: {
        type: Number,
        required: [true, "End destination longitude is required"],
        min: [-180, "Longitude must be between -180 and 180"],
        max: [180, "Longitude must be between -180 and 180"],
      },
    },
    subStations: {
      type: [SubStationSchema],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "There must be at least one substation",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Route", RouteSchema);
