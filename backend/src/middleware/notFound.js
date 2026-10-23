export function notFoundHandler(_req, _res, next) {
  const error = new Error("Route not found");
  error.statusCode = 404;
  error.code = "NOT_FOUND";
  next(error);
}