// import fs from "fs";
// import {
//   createQuoteService,
//   downloadQuoteFileService,
//   getQuoteById,
//   listQuotesService,
// } from "./Customerquote.service.js";
// // import * as quoteService from "../services/customerQuote.service.js";

// export const createQuote = async (req, res, next) => {
//   try {
//     const { name, phone, email, note } = req.body;

//     if (!name || !phone || !email) {
//       if (req.file) fs.unlink(req.file.path, () => {});
//       return res
//         .status(400)
//         .json({ message: "Name, phone and email are required." });
//     }

//     const quote = await createQuoteService(
//       { name, phone, email, note },
//       req.file,
//     );

//     return res.status(201).json({
//       message: "Quote request received.",
//       data: quote,
//     });
//   } catch (err) {
//     if (req.file) fs.unlink(req.file.path, () => {});
//     next(err);
//   }
// };

// export const listQuotes = async (req, res, next) => {
//   try {
//     const { page = 1, limit = 20 } = req.query;

//     const result = await listQuotesService({
//       page,
//       limit,
//     });

//     return res.status(200).json({
//       success: true,
//       ...result,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// /**
//  * GET /api/quotes/:id
//  * Get single customer quote
//  */
// export const getQuote = async (req, res, next) => {
//   try {
//     console.log("Quote ID:", req.params.id);

//     const quote = await getQuoteById(req.params.id);

//     return res.status(200).json({
//       success: true,
//       data: quote,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const downloadQuoteFile = async (req, res, next) => {
//   try {
//     const { filePath, fileName } = await downloadQuoteFileService(
//       req.params.id,
//     );

//     return res.download(filePath, fileName);
//   } catch (err) {
//     next(err);
//   }
// };

import mongoose from "mongoose";

import {
  getQuoteFileService,
  getQuoteById,
  listQuotesService,
  createQuoteService,
} from "./Customerquote.service.js";
import { getGridFSBucket } from "./gridfs.js";

/**
 * POST
 *
 * /api/v1/photofebrik/quote/up-customer-quote
 */
export const createQuote = async (req, res, next) => {
  try {
    const { name, phone, email, note } = req.body;

    /**
     * Validate customer information.
     */
    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,

        message: "Name, phone and email are required.",
      });
    }

    /**
     * Validate uploaded file.
     */
    if (!req.file) {
      return res.status(400).json({
        success: false,

        message: "A CAD file is required.",
      });
    }

    /**
     * Create quote and upload
     * file into GridFS.
     */
    const quote = await createQuoteService(
      {
        name,
        phone,
        email,
        note,
      },
      req.file,
    );

    return res.status(201).json({
      success: true,

      message: "Quote request received.",

      data: quote,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET
 *
 * /api/v1/photofebrik/quote/get-all-customer-quote
 */
export const listQuotes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await listQuotesService({
      page,
      limit,
    });

    return res.status(200).json({
      success: true,

      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET
 *
 * /api/v1/photofebrik/quote/:id
 */
export const getQuote = async (req, res, next) => {
  try {
    const quote = await getQuoteById(req.params.id);

    return res.status(200).json({
      success: true,

      data: quote,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET
 *
 * /api/v1/photofebrik/quote/:id/download
 *
 * Download the actual CAD file
 * from MongoDB GridFS.
 */
export const downloadQuoteFile = async (req, res, next) => {
  try {
    const { fileId, fileName, mimetype } = await getQuoteFileService(
      req.params.id,
    );

    /**
     * Validate GridFS file ID.
     */
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,

        message: "Invalid file ID.",
      });
    }

    const bucket = getGridFSBucket();

    /**
     * Headers.
     */
    res.setHeader("Content-Type", mimetype || "application/octet-stream");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );

    /**
     * Create GridFS download stream.
     */
    const downloadStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId),
    );

    downloadStream.on("error", (error) => {
      console.error("GridFS download error:", error);

      if (!res.headersSent) {
        res.status(404).json({
          success: false,

          message: "File not found.",
        });
      }
    });

    downloadStream.pipe(res);
  } catch (err) {
    next(err);
  }
};
