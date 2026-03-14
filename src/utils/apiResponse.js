const success = (res, data = {}, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const error = (res, message = "Something went wrong", statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

const paginated = (res, data, pagination, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total:      pagination.total,
      page:       pagination.page,
      limit:      pagination.limit,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext:    pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev:    pagination.page > 1,
    },
  });
};

module.exports = { success, error, paginated };