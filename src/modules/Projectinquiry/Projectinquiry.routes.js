import { Router } from "express";
import {
  createProjectInquiry,
  deleteInquiry,
  getProjectInquiry,
  inquirySummary,
  listProjectInquiries,
  patchInquiryNote,
  patchInquiryStatus,
  postMarkInquiryRead,
} from "./Projectinquiry.controller.js";
import { adminAuth } from "../../middleware/auth.middleware.js";

const route = Router();

/* PUBLIC */
route.post("/create-project-inquiries", createProjectInquiry);

/* ADMIN (auth required) */
route.get("/dashboard-summary", adminAuth, inquirySummary);
route.get("/list-project-inquiries", adminAuth, listProjectInquiries);
route.get("/get-project-inquiry/:id", adminAuth, getProjectInquiry);
route.patch("/:id/status", adminAuth, patchInquiryStatus);
route.patch("/:id/admin-note", adminAuth, patchInquiryNote);
route.post("/:id/read", adminAuth, postMarkInquiryRead);
route.delete("/:id", adminAuth, deleteInquiry);

export const ProjectInquiryRoute = route;
