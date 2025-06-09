//review, rating, created at, ref to tour and to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');
const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'you need to add a review'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      trim: true,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name, photo',
  });
  next();
});
reviewSchema.statics.calcAverage = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        ratings: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].ratings,
      ratingsAverage: stats[0].averageRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
reviewSchema.post('save', function () {
  //this poionts to current reveiw
  this.constructor.calcAverage(this.tour);
});
//findByIdAndUpdate is the same as findOneAndUpdate({})
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne(); // get the document before update/delete
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // use this.r (the document you got in pre hook)
  if (this.r) {
    await this.r.constructor.calcAverage(this.r.tour);
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
