const Tour = require('./../models/tourModel');
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
exports.getTour = (req, res) => {
  res.status(200).render('tour', {
    title: 'The forest hiker',
  });
};
