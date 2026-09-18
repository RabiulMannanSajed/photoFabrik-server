import path from "path";
import mongoose from "mongoose";

import { getGridFSBucket } from "../customerQuote/gridfs.js";
import { ProjectQuote } from "./ProjectQuote.model.js";
import { detectProjectPriority } from "./urgencyDetector.js";

/**
 * Parse "true"/"false"/"1"/"0"/undefined → boolean.
 * Multipart form data arrives as strings.
 */
const toBool = (v) => {
  if (v === true || v === false) return v;
  if (v === undefined || v === null) return false;
  const s = String(v).toLowerCase().trim();
  return s === "true" || s === "1" || s === "yes" || s === "on";
};

const REQUIRED_FIELDS = [
  "fullName",
  "email",
  "phone",
  "projectDescription",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate the multipart-form payload before touching GridFS / Mongo.
 * Throws an Error with .status = 400 on failure.
 */
const validateProjectQuoteInput = (body, file) => {
  const missing = REQUIRED_FIELDS.filter(
    (k) => !body[k] || String(body[k]).trim() === "",
  );
  if (missing.length > 0) {
    const err = new Error(
      `Missing required field(s): ${missing.join(", ")}`,
    );
    err.status = 400;
    throw err;
  }
  if (!file) {
    const err = new Error("A project/CAD file is required.");
    err.status = 400;
    throw err;
  }
  if (!EMAIL_RE.test(String(body.email).trim())) {
    const err = new Error("Invalid email address.");
    err.status = 400;
    throw err;
  }
  if (!toBool(body.agreedToTerms)) {
    const err = new Error("Terms must be accepted.");
    err.status = 400;
    throw err;
  }
};

/**
 * Create a ProjectQuote and stream the file into GridFS.
 *
 * Reuses:
 *   - gridfs.js        (same bucket as customerQuote)
 *   - Upload.middleware.js (Multer extension + size validation already
 *     ran by the time we got here)
 */
export const createProjectQuoteService = async (body, file) => {
  validateProjectQuoteInput(body, file);

  const bucket = getGridFSBucket();
  const extension = path.extname(file.originalname).toLowerCase();

  const storedName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${
    file.originalname
  }`;

  const uploadStream = bucket.openUploadStream(storedName, {
    metadata: {
      originalName: file.originalname,
      mimetype: file.mimetype || "application/octet-stream",
      extension,
    },
  });

  await new Promise((resolve, reject) => {
    uploadStream.on("finish", resolve);
    uploadStream.on("error", reject);
    uploadStream.end(file.buffer);
  });

  const { priority, reason } = detectProjectPriority(body.projectDescription);

  try {
    const doc = await ProjectQuote.create({
      fullName: String(body.fullName).trim(),
      companyName: String(body.companyName || "").trim(),
      email: String(body.email).trim().toLowerCase(),
      phone: String(body.phone).trim(),
      industry: String(body.industry || "").trim(),
      projectDescription: String(body.projectDescription).trim(),
      isStudent: toBool(body.isStudent),
      agreedToNDA: toBool(body.agreedToNDA),
      agreedToTerms: true,
      file: {
        originalName: file.originalname,
        fileId: uploadStream.id,
        mimetype: file.mimetype || "application/octet-stream",
        size: file.size,
        extension,
      },
      status: "unread",
      priority,
      priorityReason: reason,
      priorityManuallySet: false,
    });
    return doc;
  } catch (error) {
    // Roll back GridFS upload if Mongo write fails.
    try {
      await bucket.delete(uploadStream.id);
    } catch (e) {
      console.error("GridFS rollback failed:", e);
    }
    throw error;
  }
};

/**
 * Smart default sort:
 *   1. status weight  : unread first, then read, in_review, quoted,
 *                       rejected, completed
 *   2. priority desc  : urgent before normal
 *   3. createdAt desc : newest first
 *
 * `statusOrder` is aggregated via $addFields so we can sort numerically
 * without a stored statusOrder column.
 */
const STATUS_ORDER = {
  unread: 0,
  read: 1,
  in_review: 2,
  quoted: 3,
  rejected: 4,
  completed: 5,
};

const buildSmartSort = () => [
  { statusRank: 1 },
  { priority: -1 },
  { createdAt: -1 },
];

const buildStatusRankStage = () => {
  const branches = {};
  Object.entries(STATUS_ORDER).forEach(([status, rank]) => {
    branches[status] = rank;
  });
  return {
    $addFields: {
      statusRank: { $switch: { branches: Object.entries(branches).map(([k, v]) => ({ case: { $eq: ["$status", k] }, then: v })), default: 99 } },
    },
  };
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * List with search, filters, pagination and smart sort.
 *
 * @param {{
 *   page?: number|string,
 *   limit?: number|string,
 *   search?: string,
 *   status?: string,
 *   priority?: string,
 *   industry?: string,
 *   sort?: string,    // "newest" | "oldest" | "smart"
 * }} query
 */
export const listProjectQuotesService = async (query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) filter.status = String(query.status);
  if (query.priority) filter.priority = String(query.priority);
  if (query.industry) filter.industry = String(query.industry);

  if (query.search && String(query.search).trim() !== "") {
    const term = String(query.search).trim();
    const re = new RegExp(escapeRegex(term), "i");
    filter.$or = [
      { fullName: re },
      { companyName: re },
      { email: re },
      { phone: re },
      { industry: re },
      { projectDescription: re },
      { "file.originalName": re },
      { priorityReason: re },
      { status: re },
      { priority: re },
      { adminNote: re },
    ];
  }

  const useSmart = (query.sort || "smart") === "smart";

  let cursor = ProjectQuote.find(filter);

  if (useSmart) {
    cursor = ProjectQuote.aggregate([
      { $match: filter },
      buildStatusRankStage(),
      { $sort: { statusRank: 1, priority: -1, createdAt: -1 } },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
      {
        $project: {
          items: 1,
          total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
          page: { $literal: page },
          limit: { $literal: limit },
          totalPages: {
            $ceil: {
              $divide: [
                { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
                limit,
              ],
            },
          },
        },
      },
    ]);
    const agg = await cursor;
    const result = agg[0] || { items: [], total: 0, totalPages: 0 };
    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  const sortSpec =
    query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    cursor.sort(sortSpec).skip(skip).limit(limit).lean(),
    ProjectQuote.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Dashboard counts (fast — uses countDocuments with index on status).
 */
export const dashboardSummaryService = async () => {
  const [total, unread, urgent, inReview, quoted, completed, rejected] =
    await Promise.all([
      ProjectQuote.estimatedDocumentCount(),
      ProjectQuote.countDocuments({ status: "unread" }),
      ProjectQuote.countDocuments({
        priority: "urgent",
        status: { $in: ["unread", "read"] },
      }),
      ProjectQuote.countDocuments({ status: "in_review" }),
      ProjectQuote.countDocuments({ status: "quoted" }),
      ProjectQuote.countDocuments({ status: "completed" }),
      ProjectQuote.countDocuments({ status: "rejected" }),
    ]);

  return { total, unread, urgent, inReview, quoted, completed, rejected };
};

/**
 * Find by id (ObjectId validated).
 * Auto-marks unread → read on first access.
 */
export const getProjectQuoteByIdService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid project quote ID.");
    err.status = 400;
    throw err;
  }

  // Atomic find-and-update so concurrent reads don't double-write.
  const updated = await ProjectQuote.findOneAndUpdate(
    { _id: id, status: "unread" },
    { $set: { status: "read", readAt: new Date() } },
    { new: true },
  ).lean();

  if (updated) return updated;

  const existing = await ProjectQuote.findById(id).lean();
  if (!existing) {
    const err = new Error("Project quote not found.");
    err.status = 404;
    throw err;
  }
  return existing;
};

/**
 * Patch status.
 */
export const updateStatusService = async (id, status) => {
  const allowed = [
    "unread",
    "read",
    "in_review",
    "quoted",
    "rejected",
    "completed",
  ];
  if (!allowed.includes(status)) {
    const err = new Error(
      `Invalid status. Allowed: ${allowed.join(", ")}`,
    );
    err.status = 400;
    throw err;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid project quote ID.");
    err.status = 400;
    throw err;
  }

  const update = { status };
  if (status === "read" && !undefined /* just sets status; readAt is set on detail fetch */) {
    // no-op, kept intentionally for clarity
  }

  const doc = await ProjectQuote.findByIdAndUpdate(id, update, {
    new: true,
  }).lean();
  if (!doc) {
    const err = new Error("Project quote not found.");
    err.status = 404;
    throw err;
  }
  return doc;
};

/**
 * Patch priority. Marks priorityManuallySet = true so the auto-detector
 * doesn't overwrite it later.
 */
export const updatePriorityService = async (id, priority) => {
  if (!["normal", "urgent"].includes(priority)) {
    const err = new Error("Priority must be 'normal' or 'urgent'.");
    err.status = 400;
    throw err;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid project quote ID.");
    err.status = 400;
    throw err;
  }

  const doc = await ProjectQuote.findByIdAndUpdate(
    id,
    { priority, priorityManuallySet: true },
    { new: true },
  ).lean();
  if (!doc) {
    const err = new Error("Project quote not found.");
    err.status = 404;
    throw err;
  }
  return doc;
};

/**
 * Patch admin note.
 */
export const updateAdminNoteService = async (id, adminNote) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid project quote ID.");
    err.status = 400;
    throw err;
  }
  const doc = await ProjectQuote.findByIdAndUpdate(
    id,
    { adminNote: String(adminNote || "") },
    { new: true },
  ).lean();
  if (!doc) {
    const err = new Error("Project quote not found.");
    err.status = 404;
    throw err;
  }
  return doc;
};

/**
 * Get the GridFS metadata for a project quote.
 */
export const getProjectQuoteFileService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid project quote ID.");
    err.status = 400;
    throw err;
  }
  const doc = await ProjectQuote.findById(id).lean();
  if (!doc) {
    const err = new Error("Project quote not found.");
    err.status = 404;
    throw err;
  }
  if (!doc.file?.fileId) {
    const err = new Error("No file attached to this project quote.");
    err.status = 404;
    throw err;
  }
  return {
    fileId: doc.file.fileId,
    fileName: doc.file.originalName,
    mimetype: doc.file.mimetype || "application/octet-stream",
  };
};

/**
 * Delete (admin only) — also removes the GridFS file.
 */
export const deleteProjectQuoteService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid project quote ID.");
    err.status = 400;
    throw err;
  }
  const doc = await ProjectQuote.findById(id).lean();
  if (!doc) {
    const err = new Error("Project quote not found.");
    err.status = 404;
    throw err;
  }
  try {
    const bucket = getGridFSBucket();
    if (doc.file?.fileId) {
      await bucket.delete(new mongoose.Types.ObjectId(doc.file.fileId));
    }
  } catch (e) {
    console.error("GridFS delete failed:", e);
  }
  await ProjectQuote.findByIdAndDelete(id);
  return true;
};
