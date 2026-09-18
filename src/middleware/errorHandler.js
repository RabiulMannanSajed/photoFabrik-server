import multer from "multer";

/**
 * Centralized error middleware for Express 5.
 * Maps known failures to clean 4xx responses; everything else → 500.
 *
 * Mount LAST in app.js, after all routes and middleware.
 */
export const errorHandler = (err, req, res, _next) => {
  // multer-level errors (size limit, etc.)
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large. Maximum size is 100MB."
        : err.message;
    return res.status(400).json({ success: false, message });
  }

  // Multer fileFilter rejection (custom error from Upload.middleware.js)
  if (typeof err?.message === "string" && err.message.startsWith("Unsupported file type")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Explicit .status on thrown Errors (used by services)
  if (err.status && Number.isInteger(err.status) && err.status >= 400 && err.status < 600) {
    return res.status(err.status).json({
      success: false,
      message: err.message || "Request failed.",
    });
  }

  // mongoose validation
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // CastError (bad ObjectId etc.)
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ success: false, message: `Invalid ${err.path}.` });
  }

  // Duplicate key
  if (err.code === 11000) {
    return res
      .status(409)
      .json({ success: false, message: "Duplicate value." });
  }

  // Unknown
  console.error("[errorHandler]", err);
  return res
    .status(500)
    .json({ success: false, message: "Internal server error." });
};
