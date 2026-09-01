import path from "path";
import { CustomerQuote } from "./customerQuoteSchema.js";
import mongoose from "mongoose";
import fs from "fs";
/**
 * Create a new customer quote request from form fields + an uploaded file.
 * @param {{name: string, phone: string, email: string, note?: string}} contact
 * @param {Express.Multer.File} file
 
 */

export const createQuoteService = async (contact, file) => {
  if (!file) {
    const err = new Error("A CAD file is required.");
    err.status = 400;
    throw err;
  }

  const quote = await CustomerQuote.create({
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    note: contact.note || "",
    file: {
      originalName: file.originalname,
      storedName: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      extension: path.extname(file.originalname).toLowerCase(),
    },
  });

  return quote;
};

export const getQuoteById = async (id) => {
  // Check if ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid quote ID.");
    err.status = 400;
    throw err;
  }

  // Find quote
  const quote = await CustomerQuote.findById(id).lean();

  // Quote does not exist
  if (!quote) {
    const err = new Error("Quote not found.");
    err.status = 404;
    throw err;
  }

  return quote;
};

/**
 * Get all customer quotes
 */
export const listQuotesService = async ({ page = 1, limit = 20 } = {}) => {
  // Convert query values to numbers
  const currentPage = Math.max(Number(page) || 1, 1);

  const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  // Calculate skip
  const skip = (currentPage - 1) * currentLimit;

  // Get quotes and total count at the same time
  const [items, total] = await Promise.all([
    CustomerQuote.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(currentLimit)
      .lean(),

    CustomerQuote.countDocuments(),
  ]);

  return {
    items,
    total,
    page: currentPage,
    limit: currentLimit,
    totalPages: Math.ceil(total / currentLimit),
  };
};

export const downloadQuoteFileService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid quote ID.");
    err.status = 400;
    throw err;
  }

  const quote = await CustomerQuote.findById(id).lean();

  if (!quote) {
    const err = new Error("Quote not found.");
    err.status = 404;
    throw err;
  }

  if (!quote.file?.path) {
    const err = new Error("No file attached to this quote.");
    err.status = 404;
    throw err;
  }

  if (!fs.existsSync(quote.file.path)) {
    const err = new Error("File not found on server.");
    err.status = 404;
    throw err;
  }

  return {
    filePath: quote.file.path,
    fileName: quote.file.originalName,
  };
};
