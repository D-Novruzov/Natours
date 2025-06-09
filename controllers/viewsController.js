const Tour = require('./../models/tourModel');
const Review = require('./../models/reviewModel');
const User = require('./../models/userModel');
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
exports.getTour = catchAsync(async (req, res) => {
  //1) get the data for the requested tour with guides and reviews
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  //2)build template

  //3)render template from step one
  res.status(200).render('tour', {
    tour,
  });
});
