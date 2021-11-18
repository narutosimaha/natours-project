const AppError = require('./../ulities/appError');

const sendErrorDev = (err, res, req) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Error',
      msg: err.message
    });
  }
};
const sendErrorProd = (err, res, req) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    return res.status(err.statusCode).json({
      status: 'err',
      message: 'Something went wrong'
    });
  }
  //RENDER ERROR PAGE IF THE URL IS NOT STARTWITH API
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message
    });
  } else {
    res.status(err.statusCode).json({
      title: 'Something went wrong',
      msg: 'Please try again later'
    });
  }
};
const handleCastErrorForDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateName = err => {
  const message = `Duplicate ${Object.keys(err.keyValue)[0]} field: "${
    Object.values(err.keyValue)[0]
  }". Please use another value`;
  return new AppError(message, 400);
};
const handleValidationError = err => {
  const message = Object.values(err.errors)
    .map(ele => ele.message)
    .join('. ');
  return new AppError(message, 400);
};
const handleJsonWebTokenError = () =>
  new AppError('Invalid token. Please login again !', 401);
const handleTokenExpiredError = () =>
  new AppError('Your token has expired. Please login again !', 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res, req);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);
    if (error.name === 'CastError') {
      error = handleCastErrorForDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateName(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationError(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleTokenExpiredError();
    }
    sendErrorProd(error, res, req);
  }
};
