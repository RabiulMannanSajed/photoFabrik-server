import {
  createProjectQuoteService,
  deleteProjectQuoteService,
  dashboardSummaryService,
  getProjectQuoteByIdService,
  getProjectQuoteFileService,
  listProjectQuotesService,
  updateAdminNoteService,
  updatePriorityService,
  updateStatusService,
} from "./ProjectQuote.service.js";
import { getGridFSBucket } from "../customerQuote/gridfs.js";
import { ensureGridFS } from "../../app.js";
import mongoose from "mongoose";

/**
 * Public — POST /project-quotes/create-project-quote
 * multipart/form-data: fullName, companyName, email, phone, industry,
 *                      projectDescription, isStudent, agreedToNDA,
 *                      agreedToTerms, file
 */
export const createProjectQuote = async (req, res, next) => {
  try {
    await ensureGridFS();
    const doc = await createProjectQuoteService(req.body, req.file);
    res.status(201).json({
      success: true,
      message: "Project quote received. We'll be in touch shortly.",
      data: doc,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin — GET /project-quotes?search=&status=&priority=&industry=&page=&limit=&sort=
 */
export const listProjectQuotes = async (req, res, next) => {
  try {
    const result = await listProjectQuotesService(req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin — GET /project-quotes/dashboard-summary
 */
export const dashboardSummary = async (req, res, next) => {
  try {
    const data = await dashboardSummaryService();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin — GET /project-quotes/:id  (auto-marks unread → read)
 */
export const getProjectQuote = async (req, res, next) => {
  try {
    const doc = await getProjectQuoteByIdService(req.params.id);
    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin — PATCH /project-quotes/:id/status
 */
export const patchStatus = async (req, res, next) => {
  try {
    const doc = await updateStatusService(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin — PATCH /project-quotes/:id/priority
 */
export const patchPriority = async (req, res, next) => {
  try {
    const doc = await updatePriorityService(req.params.id, req.body.priority);
    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin — PATCH /project-quotes/:id/admin-note
 */
export const patchAdminNote = async (req, res, next) => {
  try {
    const doc = await updateAdminNoteService(
      req.params.id,
      req.body.adminNote,
    );
    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin — GET /project-quotes/:id/download
 */
export const downloadProjectQuoteFile = async (req, res, next) => {
  try {
    await ensureGridFS();
    const { fileId, fileName, mimetype } = await getProjectQuoteFileService(
      req.params.id,
    );

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid file ID." });
    }

    const bucket = getGridFSBucket();
    res.setHeader(
      "Content-Type",
      mimetype || "application/octet-stream",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );

    const downloadStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId),
    );
    downloadStream.on("error", (error) => {
      console.error("GridFS download error:", error);
      if (!res.headersSent) {
        res
          .status(404)
          .json({ success: false, message: "File not found." });
      }
    });
    downloadStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

/**
 * Admin — DELETE /project-quotes/:id
 */
export const deleteProjectQuote = async (req, res, next) => {
  try {
    await ensureGridFS();
    await deleteProjectQuoteService(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Project quote deleted." });
  } catch (err) {
    next(err);
  }
};
