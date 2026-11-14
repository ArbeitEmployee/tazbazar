require("dotenv").config();
const mongoose = require("mongoose");
const app = require("../src/app");

const MONGODB_URI = process.env.MONGODB_URI;

let isConnecting = false;

const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (isConnecting) {
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return;
  }

  isConnecting = true;
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    console.error("Serverless MongoDB connection error:", error.message);
    throw error;
  } finally {
    isConnecting = false;
  }
};

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
  } catch (error) {
    return res.status(500).json({
      error: "Database connection failed",
      message: error.message,
    });
  }
  return app(req, res);
};
