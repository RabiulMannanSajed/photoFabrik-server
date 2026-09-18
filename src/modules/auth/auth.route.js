import { Router } from "express";
import { login, me } from "./auth.controller.js";
import { adminAuth } from "../../middleware/auth.middleware.js";

const route = Router();

route.post("/login", login);
route.get("/me", adminAuth, me);

export const authRoute = route;
