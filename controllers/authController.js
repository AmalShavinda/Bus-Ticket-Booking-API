import User from "../models/User.js";
import Employee from "../models/Employee.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

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
//     try {
//       const user = await User.findOne({ username: req.body.username });
  
//       if (!user) return res.status(404).send("User not found");
  
//       const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
//       if (!isPasswordCorrect) return res.status(400).send("Wrong password or username");
  
//       const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
//         expiresIn: "1d",
//       });
  
//       const { password, ...otherDetails } = user._doc;
  
//       res
//         .cookie("access_token", token, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//         })
//         .status(200)
//         .send({token: token, details: { ...otherDetails }, isAdmin: user.isAdmin });
//     } catch (error) {
//       next(error);
//     }
//   };


export const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // Search for the user in the User collection
    let user = await User.findOne({ username });
    let role;

    if (user) {
      // Determine role based on isAdmin
      role = user.isAdmin ? 'admin' : 'client';
    } else {
      // If not found in User, check Employee collection
      user = await Employee.findOne({ username });
      if (user) {
        role = 'employee';
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

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: role, isAdmin: user.isAdmin || false },
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
        role,
        details: { ...otherDetails },
        isAdmin: user.isAdmin || false,
      });
  } catch (error) {
    next(error);
  }
};