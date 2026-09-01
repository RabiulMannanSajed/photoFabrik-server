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
import "dotenv/config"; // must run before anything that reads process.env at import time

import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import app from "./app.js";

async function main() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z68se.mongodb.net/photofebrik?retryWrites=true&w=majority&appName=Cluster0`,
    );
    console.log("MongoDB connected successfully!");
    app.listen(process.env.PORT, () => {
      console.log(`App listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
}
main();
