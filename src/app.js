import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import router from "./router/router.js";

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

export default app;
