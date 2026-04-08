/**
 * Sets the JWT as an HttpOnly cookie on the response.
 * HttpOnly = JS cannot read it (XSS safe).
 * Secure = HTTPS only in production.
 * SameSite = Lax prevents most CSRF attacks.
 */
exports.setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

/**
 * Clears the auth cookie (used during logout).
 */
exports.clearTokenCookie = (res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
};