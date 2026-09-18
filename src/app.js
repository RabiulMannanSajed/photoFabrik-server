import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import router from "./router/router.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initGridFS } from "./modules/customerQuote/gridfs.js";
import mongoose from "mongoose";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//
app.use("/api/v1/photofebrik", router);

const getController = (req, res) => {
  res.status(200).json({
    success: true,
    message: "photofebrik is running ",
  });
};

app.get("/", getController);

/**
 * Ensure GridFS bucket is initialized.
 *
 * On Vercel/serverless, this function is invoked cold on the first
 * request after mongoose has connected. On local dev (server.js),
 * connectDB() runs first, so this is safe.
 */
export const ensureGridFS = async () => {
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) return resolve();
      mongoose.connection.once("open", resolve);
    });
  }
  try {
    initGridFS();
  } catch (e) {
    console.error("GridFS init failed:", e.message);
  }
};

// Centralized error handler — must be LAST.
app.use(errorHandler);

export default app;
