import mongoose from "mongoose";
import { ProjectInquiry } from "./Projectinquiry.model.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createProjectInquiryIntoDB = async (data) => {
  const inquiry = await ProjectInquiry.create({
    fullName: data.fullName,
    companyName: data.companyName || "",
    email: data.email,
    phone: data.phone || "",
    industry: data.industry || "",
    companySize: data.companySize || "",
    helpNeeded: data.helpNeeded,
    projectStage: data.projectStage,
    projectDetails: data.projectDetails,
    status: "new",
  });

  return inquiry;
};

export const getProjectInquiryByIdFromDB = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid project inquiry ID.");
    err.status = 400;
    throw err;
  }
  const inquiry = await ProjectInquiry.findById(id);
  if (!inquiry) {
    const err = new Error("Inquiry not found.");
    err.status = 404;
    throw err;
  }
  return inquiry;
};

/**
 * Admin list — supports search, status filter, pagination, smart sort
 * (newest first; status-weighted by mongoose order in service).
 */
export const listProjectInquiriesFromDB = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
} = {}) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (currentPage - 1) * currentLimit;

  const filter = {};
  if (status) filter.status = status;
  if (search && String(search).trim() !== "") {
    const term = String(search).trim();
    const re = new RegExp(escapeRegex(term), "i");
    filter.$or = [
      { fullName: re },
      { companyName: re },
      { email: re },
      { phone: re },
      { industry: re },
      { companySize: re },
      { helpNeeded: re },
      { projectStage: re },
      { projectDetails: re },
      { adminNote: re },
    ];
  }

  const STATUS_ORDER = { new: 0, contacted: 1, closed: 2 };
  const matchBranch = Object.entries(STATUS_ORDER).map(([k, v]) => ({
    case: { $eq: ["$status", k] },
    then: v,
  }));

  const items = await ProjectInquiry.aggregate([
    { $match: filter },
    { $addFields: { statusRank: { $switch: { branches: matchBranch, default: 99 } } } },
    { $sort: { statusRank: 1, createdAt: -1 } },
    { $skip: skip },
    { $limit: currentLimit },
  ]);

  const total = await ProjectInquiry.countDocuments(filter);

  return {
    items,
    total,
    page: currentPage,
    limit: currentLimit,
    totalPages: Math.ceil(total / currentLimit),
  };
};

export const updateInquiryStatusService = async (id, status) => {
  if (!["new", "contacted", "closed"].includes(status)) {
    const err = new Error("Invalid status.");
    err.status = 400;
    throw err;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid project inquiry ID.");
    err.status = 400;
    throw err;
  }
  const update = { status };
  if (status !== "new") update.readAt = new Date();

  const doc = await ProjectInquiry.findByIdAndUpdate(id, update, {
    new: true,
  });
  if (!doc) {
    const err = new Error("Inquiry not found.");
    err.status = 404;
    throw err;
  }
  return doc;
};

export const updateInquiryNoteService = async (id, adminNote) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid project inquiry ID.");
    err.status = 400;
    throw err;
  }
  const doc = await ProjectInquiry.findByIdAndUpdate(
    id,
    { adminNote: String(adminNote || "") },
    { new: true },
  );
  if (!doc) {
    const err = new Error("Inquiry not found.");
    err.status = 404;
    throw err;
  }
  return doc;
};

export const markInquiryReadService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid project inquiry ID.");
    err.status = 400;
    throw err;
  }
  // Idempotent: if not yet read, mark it; otherwise return existing.
  const doc = await ProjectInquiry.findOneAndUpdate(
    { _id: id, readAt: null },
    { readAt: new Date() },
    { new: true },
  );
  if (doc) return doc;
  const existing = await ProjectInquiry.findById(id);
  if (!existing) {
    const err = new Error("Inquiry not found.");
    err.status = 404;
    throw err;
  }
  return existing;
};

export const deleteInquiryService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid project inquiry ID.");
    err.status = 400;
    throw err;
  }
  const doc = await ProjectInquiry.findByIdAndDelete(id);
  if (!doc) {
    const err = new Error("Inquiry not found.");
    err.status = 404;
    throw err;
  }
  return doc;
};

export const inquirySummaryService = async () => {
  const [total, fresh, contacted, closed] = await Promise.all([
    ProjectInquiry.estimatedDocumentCount(),
    ProjectInquiry.countDocuments({ status: "new" }),
    ProjectInquiry.countDocuments({ status: "contacted" }),
    ProjectInquiry.countDocuments({ status: "closed" }),
  ]);
  return { total, new: fresh, contacted, closed };
};
