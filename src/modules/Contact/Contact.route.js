import { Router } from "express";
import {
  contactSummary,
  deleteContactSubmission,
  getContactSubmission,
  listContactSubmissions,
  patchContactNote,
  patchContactStatus,
  submitContact,
} from "./Contact.controller.js";
import { adminAuth } from "../../middleware/auth.middleware.js";
import { projectQuoteRateLimit } from "../../middleware/rateLimit.js";

const route = Router();

/* PUBLIC */
route.post("/submit", projectQuoteRateLimit, submitContact);

/* ADMIN */
route.get("/dashboard-summary", adminAuth, contactSummary);
route.get("/submissions", adminAuth, listContactSubmissions);
route.get("/submissions/:id", adminAuth, getContactSubmission);
route.patch("/submissions/:id/status", adminAuth, patchContactStatus);
route.patch("/submissions/:id/admin-note", adminAuth, patchContactNote);
route.delete("/submissions/:id", adminAuth, deleteContactSubmission);

export const ContactRoute = route;
