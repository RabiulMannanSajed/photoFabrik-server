// import path from "path";
// import { CustomerQuote } from "./customerQuoteSchema.js";
// import mongoose from "mongoose";
// import fs from "fs";
// /**
//  * Create a new customer quote request from form fields + an uploaded file.
//  * @param {{name: string, phone: string, email: string, note?: string}} contact
//  * @param {Express.Multer.File} file

//  */

// export const createQuoteService = async (contact, file) => {
//   if (!file) {
//     const err = new Error("A CAD file is required.");
//     err.status = 400;
//     throw err;
//   }

//   const quote = await CustomerQuote.create({
//     name: contact.name,
//     phone: contact.phone,
//     email: contact.email,
//     note: contact.note || "",
//     file: {
//       originalName: file.originalname,
//       storedName: file.filename,
//       path: file.path,
//       mimetype: file.mimetype,
//       size: file.size,
//       extension: path.extname(file.originalname).toLowerCase(),
//     },
//   });

//   return quote;
// };

// export const getQuoteById = async (id) => {
//   // Check if ID is a valid MongoDB ObjectId
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     const err = new Error("Invalid quote ID.");
//     err.status = 400;
//     throw err;
//   }

//   // Find quote
//   const quote = await CustomerQuote.findById(id).lean();

//   // Quote does not exist
//   if (!quote) {
//     const err = new Error("Quote not found.");
//     err.status = 404;
//     throw err;
//   }

//   return quote;
// };

// /**
//  * Get all customer quotes
//  */
// export const listQuotesService = async ({ page = 1, limit = 20 } = {}) => {
//   // Convert query values to numbers
//   const currentPage = Math.max(Number(page) || 1, 1);

//   const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

//   // Calculate skip
//   const skip = (currentPage - 1) * currentLimit;

//   // Get quotes and total count at the same time
//   const [items, total] = await Promise.all([
//     CustomerQuote.find()
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(currentLimit)
//       .lean(),

//     CustomerQuote.countDocuments(),
//   ]);

//   return {
//     items,
//     total,
//     page: currentPage,
//     limit: currentLimit,
//     totalPages: Math.ceil(total / currentLimit),
//   };
// };

// export const downloadQuoteFileService = async (id) => {
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     const err = new Error("Invalid quote ID.");
//     err.status = 400;
//     throw err;
//   }

//   const quote = await CustomerQuote.findById(id).lean();

//   if (!quote) {
//     const err = new Error("Quote not found.");
//     err.status = 404;
//     throw err;
//   }

//   if (!quote.file?.path) {
//     const err = new Error("No file attached to this quote.");
//     err.status = 404;
//     throw err;
//   }

//   if (!fs.existsSync(quote.file.path)) {
//     const err = new Error("File not found on server.");
//     err.status = 404;
//     throw err;
//   }

//   return {
//     filePath: quote.file.path,
//     fileName: quote.file.originalName,
//   };
// };

import path from "path";
import mongoose from "mongoose";

import { CustomerQuote } from "./customerQuoteSchema.js";
import { getGridFSBucket } from "./gridfs.js";

/**
 * Create a customer quote and upload
 * the CAD file directly into MongoDB GridFS.
 */
export const createQuoteService = async (contact, file) => {
  if (!file) {
    const err = new Error("A CAD file is required.");

    err.status = 400;

    throw err;
  }

  if (!file.buffer) {
    const err = new Error("Uploaded file buffer is missing.");

    err.status = 400;

    throw err;
  }

  const bucket = getGridFSBucket();

  const extension = path.extname(file.originalname).toLowerCase();

  /**
   * Generate a unique filename.
   */
  const storedName = `${Date.now()}-${Math.round(
    Math.random() * 1e9,
  )}-${file.originalname}`;

  /**
   * Create GridFS upload stream.
   */
  const uploadStream = bucket.openUploadStream(storedName, {
    metadata: {
      originalName: file.originalname,

      mimetype: file.mimetype || "application/octet-stream",

      extension,
    },
  });

  /**
   * Upload buffer into MongoDB GridFS.
   */
  await new Promise((resolve, reject) => {
    uploadStream.on("finish", resolve);

    uploadStream.on("error", reject);

    uploadStream.end(file.buffer);
  });

  /**
   * Save quote information
   * into CustomerQuote collection.
   */
  try {
    const quote = await CustomerQuote.create({
      name: contact.name,

      phone: contact.phone,

      email: contact.email,

      note: contact.note || "",

      file: {
        originalName: file.originalname,

        fileId: uploadStream.id,

        mimetype: file.mimetype || "application/octet-stream",

        size: file.size,

        extension,
      },
    });

    return quote;
  } catch (error) {
    /**
     * If quote creation fails,
     * remove uploaded GridFS file.
     */
    try {
      await bucket.delete(uploadStream.id);
    } catch (deleteError) {
      console.error("Failed to delete GridFS file:", deleteError);
    }

    throw error;
  }
};

/**
 * Get quote by ID.
 */
export const getQuoteById = async (id) => {
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

  return quote;
};

/**
 * Get all customer quotes.
 */
export const listQuotesService = async ({ page = 1, limit = 20 } = {}) => {
  const currentPage = Math.max(Number(page) || 1, 1);

  const currentLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const skip = (currentPage - 1) * currentLimit;

  const [items, total] = await Promise.all([
    CustomerQuote.find()
      .sort({
        createdAt: -1,
      })
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

/**
 * Get file information from quote.
 */
export const getQuoteFileService = async (id) => {
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

  if (!quote.file?.fileId) {
    const err = new Error("No file attached to this quote.");

    err.status = 404;

    throw err;
  }

  return {
    fileId: quote.file.fileId,

    fileName: quote.file.originalName,

    mimetype: quote.file.mimetype || "application/octet-stream",
  };
};

/**
 * Delete a quote and its GridFS file.
 *
 * Useful later for your admin panel.
 */
export const deleteQuoteService = async (id) => {
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

  const bucket = getGridFSBucket();

  /**
   * Delete GridFS file.
   */
  if (quote.file?.fileId) {
    try {
      await bucket.delete(new mongoose.Types.ObjectId(quote.file.fileId));
    } catch (error) {
      console.error("GridFS file delete error:", error);
    }
  }

  /**
   * Delete quote document.
   */
  await CustomerQuote.findByIdAndDelete(id);

  return true;
};
