const PG_ERROR_CODES = {
  uniqueViolation: '23505',
  foreignKeyViolation: '23503',
  checkViolation: '23514',
};

function errorHandler(err, req, res, next) {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    switch (err.code) {
        case PG_ERROR_CODES.uniqueViolation:
            statusCode = 409;
            message = 'Resource already exists';
            break;
        case PG_ERROR_CODES.foreignKeyViolation:
            statusCode = 404;
            message = 'Referenced resource not found';
            break;
        case PG_ERROR_CODES.checkViolation:
            statusCode = 400;
            message = 'Invalid input value';
            break;
    }

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
}

module.exports = errorHandler;