//package to promisify a callback function
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./../models/userModel');
const catchAsync = require('./../ulities/catchSync');
const AppError = require('./../ulities/appError');
const sendEmail = require('./../ulities/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  console.log(req.body.password);
  const { email, password } = req.body;
  //1) Check if email and password exist
  if (!email || !password)
    return next(new AppError('Please provide email and password', 400));
  // 2) Check if user exists && password is conrrect
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('Incorrect password or email', 401));
  }
  const user1 = Object.create(user);
  user1.password = undefined;
  createSendToken(user1, 201, res);

  //3) If everything OK, send token to client
});

exports.authorize = catchAsync(async (req, res, next) => {
  let token = '';
  // 1) Getting token and check of it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not login. Please log in to access this resource')
    );
  }
  // 2) Verification token
  //Try to promisify jwt.verify callback function
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log('user');
  // 3) Check if user still exists
  const requestUser = await User.findById(decoded.id);
  if (!requestUser) {
    return next(
      new AppError(
        'This user has been deleted. Please register another account to be able to access !',
        401
      )
    );
  }

  // 4) Check if user changed password after the JWT was issued
  if (requestUser.isPasswordChangedAfter(decoded.iat)) {
    return next(
      new AppError(
        "This account's password has been changed. Please sign up again !"
      )
    );
  }
  req.user = requestUser;
  res.locals.user = requestUser;
  next();
});

exports.isLogin = async (req, res, next) => {
  // 1) Getting token and check of it's there
  if (req.cookies.jwt) {
    try {
      // 2) Verification token
      //Try to promisify jwt.verify callback function
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) Check if user still exists
      const requestUser = await User.findById(decoded.id);
      if (!requestUser) {
        return next();
      }

      // 4) Check if user changed password after the JWT was issued
      if (requestUser.isPasswordChangedAfter(decoded.iat)) {
        return next();
      }

      // User was logined
      res.locals.user = requestUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'Logout', {
    expires: new Date(Date.now() + 10000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles: ["admin","lead-guide"]
    console.log(roles, req.user.email, req.user.role);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to perform this action!', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on posted email
  if (!req.body.email)
    return next(new AppError('Please provide email to reset password', 404));
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError(
        `There is no user with this email address: ${req.body.email}`,
        404
      )
    );
  //2) Generate the random reset password
  const resetPassword = user.createPasswordResetToken();
  //We have to save if we modified something without using update()
  await user.save({ validateBeforeSave: false });

  //3) Send it to user mail
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetPassword}`;

  const message = `Forgot your password ? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n.`;
  try {
    console.log('123');
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 5 min)',
      message
    });
    console.log('456');
    res.status(200).json({
      status: 'success',
      message: 'Token send to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return new AppError(
      'There was an error sending the email. Try again later!',
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const tokenHash = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gte: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token does not exists or has expired', 400));
  }
  // 2) If token has not expired, and user exist, set the new password
  if (!req.body.password || !req.body.passwordConfirm) {
    return next(new AppError('Please provide and confirm password !', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changePasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select('+password');
  // 2) Check if POSTed current password is correct
  console.log('user');
  if (
    !req.body.passwordCurrent ||
    !(await user.checkPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(new AppError('Current password is not correct !', 400));
  }
  // 3) If so, update password
  if (!req.body.password || !req.body.passwordConfirm) {
    return next(
      new AppError('Please provide new password and confirm it', 400)
    );
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 201, res);
});
