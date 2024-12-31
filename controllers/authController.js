import User from "../models/User.js";
import Employee from "../models/Employee.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {
  try {
    const { username, email } = req.body;

    const existingUser = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });

    if (existingUser || existingEmail) {
      return res.status(400).send("User or Email already taken");
    }

    const newUser = new User(req.body);
    await newUser.save();

    res.status(201).send("User has been created");
  } catch (error) {
    next(error);
  }
};

// export const login = async (req, res, next) => {
//   const { username, password } = req.body;

//   try {
//     // Search for the user in the User collection
//     let user = await User.findOne({ username });
//     let role;

//     if (user) {
//       // Determine role based on isAdmin
//       role = user.isAdmin ? "admin" : "client";
//     } else {
//       // If not found in User, check Employee collection
//       user = await Employee.findOne({ username });
//       if (user) {
//         role = "employee";
//       }
//     }

//     if (!user) {
//       return res.status(404).send("User not found");
//     }

//     // Verify password
//     const isPasswordCorrect = await bcrypt.compare(password, user.password);
//     if (!isPasswordCorrect) {
//       return res.status(400).send("Wrong username or password");
//     }

//     // Generate token with role embedded in the payload
//     const token = jwt.sign(
//       { id: user._id, isAdmin: user.isAdmin }, // Ensure isAdmin is included
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     const { password: userPassword, ...otherDetails } = user._doc;

//     // Set cookie and send response
//     res
//       .cookie("access_token", token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//       })
//       .status(200)
//       .send({
//         token, // Only return the token
//         details: { ...otherDetails },
//       });
//   } catch (error) {
//     next(error);
//   }
// };

export const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // Search for the user in the User collection
    let user = await User.findOne({ username });
    let role;

    if (user) {
      // Determine role based on isAdmin
      role = user.isAdmin ? "admin" : "client";
    } else {
      // If not found in User, check Employee collection
      user = await Employee.findOne({ username });
      if (user) {
        role = "employee";
      }
    }

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).send("Wrong username or password");
    }

    // Generate token with role embedded in the payload
    const token = jwt.sign(
      { id: user._id, role }, // Include the role explicitly
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: userPassword, ...otherDetails } = user._doc;

    // Set cookie and send response
    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .send({
        token,
        details: { ...otherDetails, role }, // Include the role in the response
      });
  } catch (error) {
    next(error);
  }
};
