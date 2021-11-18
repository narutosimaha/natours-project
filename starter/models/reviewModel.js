const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have content']
    },
    rating: {
      type: Number,
      required: [true, 'You must rate to review'],
      min: [0, 'The rating of a tour must be greater than 0'],
      max: [5, 'The rating of a tour must be below 5']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//index use to set unique: a user shoud not review more than 2 times for a tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});
reviewSchema.statics.updateRatingAver_Quanti = async function(tourID) {
  const result = await this.aggregate([
    {
      $match: { tour: tourID }
    },
    {
      $group: {
        _id: '$tour',
        ratingAver: { $avg: '$rating' },
        ratingQuan: { $sum: 1 }
      }
    }
  ]);
  if (result.length > 0) {
    await Tour.findByIdAndUpdate(tourID, {
      ratingsAverage: result[0].ratingAver,
      ratingsQuantity: result[0].ratingQuan
    });
  } else {
    await Tour.findByIdAndUpdate(tourID, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0
    });
  }
};
reviewSchema.post('save', function() {
  this.constructor.updateRatingAver_Quanti(this.tour);
});

//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.post(/^findOneAnd/, function(doc) {
  doc.constructor.updateRatingAver_Quanti(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
