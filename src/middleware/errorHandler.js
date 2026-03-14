const { error } = require("../utils/apiResponse");

const notFound = (req, res, next) => {
  error(res, `Route not found: ${req.originalUrl}`, 404);
};

const errorHandler = (err, req, res, next) => {
  console.error(" Error:", err);

  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return error(res, `${field} already exists.`, 409);
  }

  if (err.code === "P2025") {
    return error(res, "Record nahi mila.", 404);
  }

  if (err.name === "ValidationError") {
    return error(res, err.message, 400);
  }

  if (err.name === "JsonWebTokenError") {
    return error(res, "Invalid token.", 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Server error ho gaya. Baad mein try karo.";
  error(res, message, statusCode);
};

module.exports = { notFound, errorHandler };