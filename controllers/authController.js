const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const { promisify } = require('util');
const crypto = require('crypto');
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
//signing up the user
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createAndSendToken(newUser, 201, res);
});
exports.login = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const { password } = req.body;
  //1) if email and passwords exist
  if (!email || !password) {
    return next(new AppError('provide email and password', 400));
  }
  //2) if the user exists if the password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401));
  }
  //3) if everything okey send token to client
  createAndSendToken(user, 200, res);
});
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};
exports.protect = catchAsync(async (req, res, next) => {
  //1) getting the token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  console.log(token);
  if (!token) {
    return next(
      new AppError('you are not logged in. Please login to get access', 401),
    );
  }
  //2)verification the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);
  //3)check if user still exists.
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('the user belonging to the token doesnot exist', 401),
    );
  }
  //4)check if the user cahnged the password after the toke was issued
  if (freshUser.changedPassAfter(decoded.iat))
    return next(new AppError('user chaned the code log in again'));
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});
//only for rendered pages there will be no error
exports.isLoggedIn = async (req, res, next) => {
  //1) getting the token

  if (req.cookies.jwt) {
    try {
      //1) verify the user
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      //2)check if user still exists.
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      //4)check if the user cahnged the password after the toke was issued
      if (freshUser.changedPassAfter(decoded.iat)) return next();
      //THERE IS A LOGGED IN USER
      res.locals.user = freshUser;
      return next();
    } catch (err) {}
  }
  return next();
};
exports.restrictTo = (...roles) => {
  //roles is an array-roles ['admin, lead-guide]
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'you do not have a permission ot perform this action',
          403,
        ),
      );
    }
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user base on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('there is no user with this emial', 404));
  }
  //2)generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3)send it as an email

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'your password reset token',
    //   message,
    // });
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('there was an error sending email, try again later', 500),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on the toke
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) if token has not been expired and there is hte user set new password
  if (!user) {
    return next(new AppError('token has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3)update changedpassat property for hte user
  //4) log the user.
  createAndSendToken(user, 200, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)get the user from the collection
  const user = await User.findById(req.user.id).select('+password');
  //2)check if the password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('please enter the correct password', 401));
  }
  //3)update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4)log user in, send   jwt
  createAndSendToken(user, 200, res);
});
