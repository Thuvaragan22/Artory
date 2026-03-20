const { errorResponse } = require("../utils/apiResponse.js");

/**
 * Validates req.query against a Joi schema.
 * Auto-converts strings to correct types (e.g. "1" → 1, "true" → true).
 */
exports.validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      convert:    true,
    });

    if (error) {
      const errors = error.details.map((d) => d.message);
      return errorResponse(res, 422, "Invalid query parameters", errors);
    }

    req.query = value; // use sanitized + defaulted values
    next();
  };
};