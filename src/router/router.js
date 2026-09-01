import { Router } from "express";
import { ArtRoutes } from "../modules/customerQuote/Customerquote.routes.js";

const router = Router();

const moduleRouters = [
  {
    path: "/quote",
    route: ArtRoutes,
  },
];

moduleRouters.forEach((route) => router.use(route.path, route.route));

export default router;
