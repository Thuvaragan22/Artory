const { errorResponse } = require("../utils/apiResponse.js");

// ─── 404 Handler ──────────────────────────────────────────────────────────────
exports.notFound = (req, res) => {
  return errorResponse(res, 404, `Route ${req.originalUrl} not found`);
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
exports.globalErrorHandler = (err, req, res, next) => {
  console.error("💥 Error:", err);

  if (err.isJoi) {
    const errors = err.details.map((d) => d.message);
    return errorResponse(res, 422, "Validation error", errors);
  }

  if (err.name === "JsonWebTokenError")  return errorResponse(res, 401, "Invalid token");
  if (err.name === "TokenExpiredError")  return errorResponse(res, 401, "Token expired");
  if (err.code  === "ER_DUP_ENTRY")     return errorResponse(res, 409, "Duplicate entry — resource already exists");

  return errorResponse(res, err.statusCode || 500, err.message || "Internal server error");
};