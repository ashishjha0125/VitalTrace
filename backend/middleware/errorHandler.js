const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details.map(d => d.message)
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  const response = {
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  res.status(err.status || 500).json(response);
};

module.exports = errorHandler;
