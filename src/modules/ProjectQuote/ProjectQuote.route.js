import { Router } from "express";

import { upload } from "../customerQuote/Upload.middleware.js";
import {
  createProjectQuote,
  dashboardSummary,
  deleteProjectQuote,
  downloadProjectQuoteFile,
  getProjectQuote,
  listProjectQuotes,
  patchAdminNote,
  patchPriority,
  patchStatus,
} from "./ProjectQuote.controller.js";
import { adminAuth } from "../../middleware/auth.middleware.js";
import { projectQuoteRateLimit } from "../../middleware/rateLimit.js";

const route = Router();

/* ============================================================
 * PUBLIC (rate-limited, no auth)
 * ========================================================== */
route.post(
  "/create-project-quote",
  projectQuoteRateLimit,
  upload.single("file"),
  createProjectQuote,
);

/* ============================================================
 * ADMIN (auth required)
 * IMPORTANT: declare /dashboard-summary BEFORE /:id so it
 * isn't shadowed by the param route.
 * ========================================================== */
route.get("/dashboard-summary", adminAuth, dashboardSummary);
route.get("/", adminAuth, listProjectQuotes);
route.get("/:id", adminAuth, getProjectQuote);
route.get("/:id/download", adminAuth, downloadProjectQuoteFile);
route.patch("/:id/status", adminAuth, patchStatus);
route.patch("/:id/priority", adminAuth, patchPriority);
route.patch("/:id/admin-note", adminAuth, patchAdminNote);
route.delete("/:id", adminAuth, deleteProjectQuote);

export const ProjectQuoteRoute = route;
