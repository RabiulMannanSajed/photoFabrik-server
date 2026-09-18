import mongoose from "mongoose";
import { ContactSubmission } from "./Contact.model.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createContactSubmissionService = async (body) => {
  const { name, email, message } = body;
  if (!name || !email || !message) {
    const err = new Error("Name, email, and message are required.");
    err.status = 400;
    throw err;
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    const err = new Error("Invalid email address.");
    err.status = 400;
    throw err;
  }

  const doc = await ContactSubmission.create({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: body.phone ? String(body.phone).trim() : "",
    company: body.company ? String(body.company).trim() : "",
    subject: body.subject ? String(body.subject).trim() : "",
    message: String(message).trim(),
    source: body.source || "website-contact-form",
    status: "new",
  });
  return doc;
};

export const listContactSubmissionsService = async ({
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
      { name: re },
      { email: re },
      { phone: re },
      { company: re },
      { subject: re },
      { message: re },
      { adminNote: re },
    ];
  }

  const STATUS_ORDER = { new: 0, read: 1, replied: 2, archived: 3 };
  const matchBranch = Object.entries(STATUS_ORDER).map(([k, v]) => ({
    case: { $eq: ["$status", k] },
    then: v,
  }));

  const items = await ContactSubmission.aggregate([
    { $match: filter },
    { $addFields: { statusRank: { $switch: { branches: matchBranch, default: 99 } } } },
    { $sort: { statusRank: 1, createdAt: -1 } },
    { $skip: skip },
    { $limit: currentLimit },
  ]);

  const total = await ContactSubmission.countDocuments(filter);

  return {
    items,
    total,
    page: currentPage,
    limit: currentLimit,
    totalPages: Math.ceil(total / currentLimit),
  };
};

export const getContactSubmissionByIdService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid contact submission ID.");
    err.status = 400;
    throw err;
  }
  // auto-mark read on first admin fetch
  const doc = await ContactSubmission.findOneAndUpdate(
    { _id: id, status: "new" },
    { $set: { status: "read", readAt: new Date() } },
    { new: true },
  );
  if (doc) return doc;
  const existing = await ContactSubmission.findById(id);
  if (!existing) {
    const err = new Error("Contact submission not found.");
    err.status = 404;
    throw err;
  }
  return existing;
};

export const updateContactStatusService = async (id, status) => {
  if (!["new", "read", "replied", "archived"].includes(status)) {
    const err = new Error("Invalid status.");
    err.status = 400;
    throw err;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid contact submission ID.");
    err.status = 400;
    throw err;
  }
  const update = { status };
  if (status === "replied") update.repliedAt = new Date();
  if (status !== "new") update.readAt = update.readAt || new Date();

  const doc = await ContactSubmission.findByIdAndUpdate(id, update, {
    new: true,
  });
  if (!doc) {
    const err = new Error("Contact submission not found.");
    err.status = 404;
    throw err;
  }
  return doc;
};

export const updateContactNoteService = async (id, adminNote) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid contact submission ID.");
    err.status = 400;
    throw err;
  }
  const doc = await ContactSubmission.findByIdAndUpdate(
    id,
    { adminNote: String(adminNote || "") },
    { new: true },
  );
  if (!doc) {
    const err = new Error("Contact submission not found.");
    err.status = 404;
    throw err;
  }
  return doc;
};

export const deleteContactSubmissionService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid contact submission ID.");
    err.status = 400;
    throw err;
  }
  const doc = await ContactSubmission.findByIdAndDelete(id);
  if (!doc) {
    const err = new Error("Contact submission not found.");
    err.status = 404;
    throw err;
  }
  return doc;
};

export const contactSummaryService = async () => {
  const [total, fresh, read, replied, archived] = await Promise.all([
    ContactSubmission.estimatedDocumentCount(),
    ContactSubmission.countDocuments({ status: "new" }),
    ContactSubmission.countDocuments({ status: "read" }),
    ContactSubmission.countDocuments({ status: "replied" }),
    ContactSubmission.countDocuments({ status: "archived" }),
  ]);
  return { total, new: fresh, read, replied, archived };
};
