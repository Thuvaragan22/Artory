const Joi = require("joi");

// ─── Update User (full edit, all fields optional) ─────────────────────────────
exports.updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).optional().messages({
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username must be at most 50 characters",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": "Please provide a valid email address",
  }),
  role: Joi.string().valid("admin", "learner", "guide").optional().messages({
    "any.only": "Role must be one of: admin, learner, guide",
  }),
  is_verified: Joi.boolean().optional(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .optional()
    .messages({
      "string.min":          "Password must be at least 8 characters",
      "string.pattern.base": "Password must contain at least one uppercase, one lowercase, and one number",
    }),
  confirmPassword: Joi.when("password", {
    is:        Joi.exist(),
    then:      Joi.string().valid(Joi.ref("password")).required().messages({
      "any.only":     "Passwords do not match",
      "any.required": "Please confirm the new password",
    }),
    otherwise: Joi.optional(),
  }),
}).min(1); // at least one field required

// ─── Update Role Only ─────────────────────────────────────────────────────────
exports.updateRoleSchema = Joi.object({
  role: Joi.string().valid("admin", "learner", "guide").required().messages({
    "any.only":     "Role must be one of: admin, learner, guide",
    "any.required": "Role is required",
  }),
});

// ─── Admin Force-Reset Password ───────────────────────────────────────────────
exports.adminResetPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.min":          "Password must be at least 8 characters",
      "string.pattern.base": "Password must contain at least one uppercase, one lowercase, and one number",
      "any.required":        "New password is required",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
    "any.only":     "Passwords do not match",
    "any.required": "Please confirm the new password",
  }),
});

// ─── GET /users query params ──────────────────────────────────────────────────
exports.getUsersQuerySchema = Joi.object({
  page:      Joi.number().integer().min(1).default(1),
  limit:     Joi.number().integer().min(1).max(100).default(10),
  role:      Joi.string().valid("admin", "learner", "guide").optional(),
  search:    Joi.string().max(100).optional(),
  sortBy:    Joi.string().valid("id", "username", "email", "role", "created_at").default("created_at"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
});