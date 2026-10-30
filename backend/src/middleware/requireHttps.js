export function requireHttps(req, res, next) {
  if (process.env.NODE_ENV === "production" && req.secure) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  const required = process.env.REQUIRE_HTTPS === "true" ||
    (process.env.NODE_ENV === "production" && process.env.REQUIRE_HTTPS !== "false");
  if (required && !req.secure) {
    return next(Object.assign(new Error("HTTPS is required"), {
      statusCode: 426,
      code: "HTTPS_REQUIRED",
    }));
  }
  return next();
}
