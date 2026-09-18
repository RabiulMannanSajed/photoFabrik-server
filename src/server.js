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

// import "dotenv/config";

// import dns from "dns";
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

// import mongoose from "mongoose";
// import app from "./app.js";

// let isConnected = false;

// const connectDB = async () => {
//   if (isConnected && mongoose.connection.readyState === 1) {
//     return;
//   }

//   console.log("Connecting to MongoDB...");

//   await mongoose.connect(
//     `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z68se.mongodb.net/photofebrik?retryWrites=true&w=majority&appName=Cluster0`,
//     {
//       serverSelectionTimeoutMS: 10000,
//     },
//   );

//   isConnected = true;

//   console.log("MongoDB connected successfully!");
// };

// const handler = async (req, res) => {
//   try {
//     await connectDB();

//     return app(req, res);
//   } catch (error) {
//     console.error("MongoDB/API error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Database connection failed.",
//       error: error.message,
//     });
//   }
// };

// export default handler;

import "dotenv/config";

import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import app from "./app.js";

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.DB_USER || !process.env.DB_PASS) {
    throw new Error(
      "DB_USER / DB_PASS are missing — check that your .env file exists and is being loaded.",
    );
  }

  console.log("Connecting to MongoDB...");

  await mongoose.connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z68se.mongodb.net/photofebrik?retryWrites=true&w=majority&appName=Cluster0`,
  );

  isConnected = true;
  console.log("MongoDB connected successfully!");
};

// Serverless entry point (e.g. Vercel functions call this per-request)
const handler = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("MongoDB/API error:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed.",
      error: error.message,
    });
  }
};

// Local / traditional server entry point — this is what was missing.
// Runs when you start the file directly (npm run dev, node src/server.js),
// but not when a serverless platform imports it and calls `handler` itself.
const isServerless = Boolean(process.env.VERCEL);

// if (!isServerless) {
//   const PORT = process.env.PORT || 5000;

//   connectDB()
//     .then(() => {
//       app.listen(PORT, () => {
//         console.log(`Server running on http://localhost:${PORT}`);
//       });
//     })
//     .catch((err) => {
//       console.error("Failed to start server:", err.message);
//       process.exit(1);
//     });
// }

export default handler;
