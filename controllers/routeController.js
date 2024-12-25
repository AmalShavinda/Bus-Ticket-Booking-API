import Route from "../models/Route.js";

export const createRoute = async (req, res) => {
  try {
    const { startPoint, endDestination } = req.body;

    const existingRoute = await Route.findOne({
      $and: [{ startPoint }, { endDestination }],
    });

    if (existingRoute) {
      return res.status(400).json({
        message: "Route already exists",
      });
    }

    const newRoute = new Route(req.body);

    await newRoute.save();
    res.status(201).json({
      message: "Route created successfully",
      data: newRoute,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message, // Send the validation error message
      });
    }
    next(error);
  }
};

export const updateRoute = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update the route by ID
    const updatedRoute = await Route.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedRoute) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.status(200).json(updatedRoute);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message, // Send the validation error message
      });
    }
    next(error);
  }
};

export const deleteRoute = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find and delete the route by ID
    const deletedRoute = await Route.findByIdAndDelete(id);

    if (!deletedRoute) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.status(200).json({ message: "Route deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAllRoutes = async (req, res, next) => {
  try {
    const routes = await Route.find();
    res.status(200).json(routes);
  } catch (error) {
    next(error);
  }
};
