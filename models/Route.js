import mongoose from "mongoose";

const SubStationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "SubStation name is required"],
  },
});

const RouteSchema = new mongoose.Schema(
  {
    startPoint: {
      name: {
        type: String,
        required: [true, "Start point name is required"],
      },
    },
    endDestination: {
      name: {
        type: String,
        required: [true, "End destination name is required"],
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
