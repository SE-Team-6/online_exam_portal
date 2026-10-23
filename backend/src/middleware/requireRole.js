export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(Object.assign(new Error("Authentication required"), {
        statusCode: 401,
        code: "UNAUTHORIZED",
      }));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(Object.assign(new Error("You do not have permission to access this resource"), {
        statusCode: 403,
        code: "FORBIDDEN",
      }));
    }

    return next();
  };
}
