const { errorResponse } = require("../utils/apiResponse.js");

/**
 * Validates req.body against a Joi schema.
 */
exports.validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((d) => d.message);
      return errorResponse(res, 422, "Validation failed", errors);
    }

    req.body = value; // use sanitized + defaulted values
    next();
  };
};