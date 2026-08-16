/**
 * Standardized API Response Utilities
 */

export function sendSuccess(res, data = null, message = 'Operation successful', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    requestId: res.req?.requestId || null,
  });
}

export function sendCreated(res, data = null, message = 'Resource created successfully') {
  return sendSuccess(res, data, message, 201);
}

export function sendError(res, message = 'An error occurred', statusCode = 500, errorCode = 'SERVER_ERROR', details = null) {
  const response = {
    success: false,
    message,
    error: {
      code: errorCode,
    },
    requestId: res.req?.requestId || null,
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
}

export function sendPaginated(res, items = [], pagination = {}, message = 'Items retrieved successfully') {
  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        total: pagination.total || items.length,
        page: pagination.page || 1,
        limit: pagination.limit || items.length,
        hasMore: pagination.hasMore !== undefined ? pagination.hasMore : false,
      },
    },
    requestId: res.req?.requestId || null,
  });
}

export default {
  sendSuccess,
  sendCreated,
  sendError,
  sendPaginated,
};
