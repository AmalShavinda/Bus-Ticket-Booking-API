import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      required: [true, "Employee ID is required"],
      trim: true,
    },
    employeeName: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
    },
    employeePosition: {
      type: String,
      required: [true, "Employee position is required"],
      trim: true,
    },
    employeeMobile: {
      type: String,
      required: [true, "Employee mobile is required"],
      trim: true,
      match: [/^\d{10}$/, "Employee mobile must be exactly 10 digits long"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", EmployeeSchema);
