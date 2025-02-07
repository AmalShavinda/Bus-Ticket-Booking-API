import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const EmployeeSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
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
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      default: null, // Only assigned for Drivers/Conductors
    },
    employeeMobile: {
      type: String,
      required: [true, "Employee mobile is required"],
      trim: true,
      match: [/^\d{10}$/, "Employee mobile must be exactly 10 digits long"],
    },
    password: {
      type: String,
      required: true,
      minLength: [8, "Password must be at least 8 characters"],
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash passwords
EmployeeSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

export default mongoose.model("Employee", EmployeeSchema);
