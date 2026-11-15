export function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.statusCode ?? error.status ?? 500;

  res.status(status).json({
    error: {
      code: error.code ?? (
        status === 404
          ? "NOT_FOUND"
          : status === 413
            ? "PAYLOAD_TOO_LARGE"
            : "INTERNAL_SERVER_ERROR"
      ),
      message: status >= 500 ? "Internal server error" : error.message,
      requestId: res.locals.requestId,
    },
  });
}
