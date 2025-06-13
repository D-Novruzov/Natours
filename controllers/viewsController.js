const Tour = require('./../models/tourModel');
const Review = require('./../models/reviewModel');
const User = require('./../models/userModel');
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
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  //1) get the data for the requested tour with guides and reviews
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (tour) {
    return next(new AppError('There is no such a tour', 404));
  }
  //2)build template

  //3)render template from step one
  res.status(200).render('tour', {
    title: `${tour.name}`,
    tour,
  });
});
exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', "connect-src 'self' http://127.0.0.1:3000/")
    .render('login', {
      title: 'Log into your account',
    });
};
