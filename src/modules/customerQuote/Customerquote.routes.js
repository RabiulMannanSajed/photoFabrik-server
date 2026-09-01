// import { Router } from "express";
// import { upload } from "./Upload.middleware.js";
// import {
//   createQuote,
//   downloadQuoteFile,
//   getQuote,
//   listQuotes,
// } from "./Customerquote.controller.js";

// const route = Router();

// // POST /api/quotes  — multipart/form-data: file, name, phone, email, note
// route.post("/up-customer-quote", upload.single("file"), createQuote);

// // GET /api/quotes         — list (paginated)

// route.get("/get-all-customer-quote", listQuotes);

// route.get("/:id", getQuote);

// route.get("/:id/download", downloadQuoteFile);

// export const ArtRoutes = route;

import { Router } from "express";

import { upload } from "./Upload.middleware.js";

import {
  createQuote,
  downloadQuoteFile,
  getQuote,
  listQuotes,
} from "./Customerquote.controller.js";

const route = Router();

/**
 * POST
 *
 * Create customer quote
 *
 * multipart/form-data:
 *
 * name
 * phone
 * email
 * note
 * file
 */
route.post("/up-customer-quote", upload.single("file"), createQuote);

/**
 * GET all quotes
 */
route.get("/get-all-customer-quote", listQuotes);

/**
 * GET single quote
 */
route.get("/:id", getQuote);

/**
 * Download CAD file
 */
route.get("/:id/download", downloadQuoteFile);

export const ArtRoutes = route;
