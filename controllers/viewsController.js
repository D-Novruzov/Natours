const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const Review = require('./../models/reviewModel');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
exports.getOverview = catchAsync(async (req, res) => {
  //1) get tour data from the collection
  const tours = await Tour.find();
  //2) build template
  //3) render the template using 1
  res.status(200).render('overview', {
    title: 'All tours',
    tours: tours,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  //1) get the data for the requested tour with guides and reviews
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (!tour) {
    return next(new AppError('There is no such a tour', 404));
  }
  //2)build template

  //3)render template from step one
  res.status(200).render('tour', {
    title: `${tour.name}`,
    tour,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  });
});
exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', "connect-src 'self' http://127.0.0.1:3000/")
    .render('login', {
      title: 'Log into your account',
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    });
};
exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  });
};
exports.getMyTours = catchAsync(async (req, res, next) => {
  //1)) find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  //2)find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render('overview', {
    title: 'My tours',
    tours,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  });
});
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  });
});
