import User from "../models/User.js";
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


export const login = async (req, res, next) => {
    try {
      const user = await User.findOne({ username: req.body.username });
  
      if (!user) return res.status(404).send("User not found");
  
      const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
      if (!isPasswordCorrect) return res.status(400).send("Wrong password or username");
  
      const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
  
      const { password, ...otherDetails } = user._doc;
  
      res
        .cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        })
        .status(200)
        .send({token: token, details: { ...otherDetails }, isAdmin: user.isAdmin });
    } catch (error) {
      next(error);
    }
  };
