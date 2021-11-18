const Review = require('./../models/reviewModel');
// const catchAsync = require('./../ulities/catchSync');
const factory = require('./../controller/factoryHandler');

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourID;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};
exports.getReview = factory.getOne(Review);
exports.postReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteModel(Review);
exports.getAllReview = factory.getAll(Review);
