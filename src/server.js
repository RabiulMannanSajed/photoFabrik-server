// // ! Remove this part
// import dotenv from "dotenv";
// import dns from "dns";
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

// import mongoose from "mongoose";
// import app from "./app.js";

// dotenv.config();

// async function main() {
//   try {
//     console.log("Connecting to MongoDB...");
//     await mongoose.connect(
//       `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z68se.mongodb.net/irong?retryWrites=true&w=majority&appName=Cluster0`,
//     );
//     console.log("MongoDB connected successfully!");
//     app.listen(process.env.PORT, () => {
//       console.log(`App listening on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("Error connecting to MongoDB:", error.message);
//   }
// }
// main();

// server.js

// import "dotenv/config"; // must run before anything that reads process.env at import time

// import dns from "dns";
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

// import mongoose from "mongoose";
// import app from "./app.js";

// async function main() {
//   try {
//     console.log("Connecting to MongoDB...");
//     await mongoose.connect(
//       `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z68se.mongodb.net/photofebrik?retryWrites=true&w=majority&appName=Cluster0`,
//     );
//     console.log("MongoDB connected successfully!");
//     app.listen(process.env.PORT, () => {
//       console.log(`App listening on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("Error connecting to MongoDB:", error.message);
//   }
// }
// main();

import "dotenv/config";

import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";

import app from "./app.js";
import { initGridFS } from "./modules/customerQuote/gridfs.js";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z68se.mongodb.net/photofebrik?retryWrites=true&w=majority&appName=Cluster0`,
    );

    console.log("MongoDB connected successfully!");

    /**
     * Initialize GridFS after
     * MongoDB connection.
     */
    initGridFS();

    isConnected = true;

    console.log("Database and GridFS ready.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);

    throw error;
  }
};

/**
 * Vercel/serverless handler.
 */
const handler = async (req, res) => {
  try {
    await connectDB();

    return app(req, res);
  } catch (error) {
    console.error("Server startup error:", error);

    return res.status(500).json({
      success: false,

      message: "Database connection failed.",
    });
  }
};

export default handler;
