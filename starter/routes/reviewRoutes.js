const express = require('express');
const reviewController = require('./../controller/reviewController');
const authoController = require('./../controller/autheController');

const reviewRouter = express.Router({ mergeParams: true });

reviewRouter.use(authoController.authorize);
reviewRouter
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authoController.restrictTo('user'),
    reviewController.setTourUserId,
    reviewController.postReview
  );
reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authoController.restrictTo('admin', 'user'),
    reviewController.deleteReview
  )
  .patch(
    authoController.restrictTo('admin', 'user'),
    reviewController.updateReview
  );
module.exports = reviewRouter;
