export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Check if the error has a status code, otherwise use 500
  const statusCode = err.statusCode || 500;
  
  // Create error response
  const errorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };
  
  res.status(statusCode).json(errorResponse);
};
