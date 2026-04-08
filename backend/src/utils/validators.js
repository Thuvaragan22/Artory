const Joi = require("joi");

// ─── Register ─────────────────────────────────────────────────────────────────
exports.registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    "string.min":   "Username must be at least 3 characters",
    "string.max":   "Username must be at most 50 characters",
    "any.required": "Username is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.min":          "Password must be at least 8 characters",
      "string.pattern.base": "Password must contain at least one uppercase, one lowercase, and one number",
      "any.required":        "Password is required",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only":     "Passwords do not match",
    "any.required": "Confirm password is required",
  }),
  role: Joi.string().valid("admin", "learner", "guide").default("learner"),
});

// ─── Login ────────────────────────────────────────────────────────────────────
exports.loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
});

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Reset token is required",
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.min":          "Password must be at least 8 characters",
      "string.pattern.base": "Password must contain at least one uppercase, one lowercase, and one number",
      "any.required":        "Password is required",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only":     "Passwords do not match",
    "any.required": "Confirm password is required",
  }),
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
exports.refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional(), // optional — can come from cookie instead
});