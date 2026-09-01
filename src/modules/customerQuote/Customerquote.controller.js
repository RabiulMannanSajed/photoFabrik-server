import fs from "fs";
import {
  createQuoteService,
  downloadQuoteFileService,
  getQuoteById,
  listQuotesService,
} from "./Customerquote.service.js";
// import * as quoteService from "../services/customerQuote.service.js";

export const createQuote = async (req, res, next) => {
  try {
    const { name, phone, email, note } = req.body;

    if (!name || !phone || !email) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res
        .status(400)
        .json({ message: "Name, phone and email are required." });
    }

    const quote = await createQuoteService(
      { name, phone, email, note },
      req.file,
    );

    return res.status(201).json({
      message: "Quote request received.",
      data: quote,
    });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

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
 * GET /api/quotes/:id
 * Get single customer quote
 */
export const getQuote = async (req, res, next) => {
  try {
    console.log("Quote ID:", req.params.id);

    const quote = await getQuoteById(req.params.id);

    return res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (err) {
    next(err);
  }
};

export const downloadQuoteFile = async (req, res, next) => {
  try {
    const { filePath, fileName } = await downloadQuoteFileService(
      req.params.id,
    );

    return res.download(filePath, fileName);
  } catch (err) {
    next(err);
  }
};
