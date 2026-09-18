import { Router } from "express";
import { ArtRoutes } from "../modules/customerQuote/Customerquote.routes.js";
import { ProjectInquiryRoute } from "../modules/Projectinquiry/Projectinquiry.routes.js";
import { ProjectQuoteRoute } from "../modules/ProjectQuote/ProjectQuote.route.js";
import { authRoute } from "../modules/auth/auth.route.js";
import { ContactRoute } from "../modules/Contact/Contact.route.js";

const router = Router();

const moduleRouters = [
  {
    path: "/quote",
    route: ArtRoutes,
  },
  {
    path: "/project-inquiries",
    route: ProjectInquiryRoute,
  },
  {
    path: "/project-quotes",
    route: ProjectQuoteRoute,
  },
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/contact",
    route: ContactRoute,
  },
];

moduleRouters.forEach((route) => router.use(route.path, route.route));

export default router;
