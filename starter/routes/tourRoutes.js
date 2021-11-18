const express = require('express');

const tourController = require(`./../controller/tourController`);
const autheController = require(`./../controller/autheController`);
const reviewRouter = require('./../routes/reviewRoutes');

const tourRouter = express.Router();

// Ex: /tours/1231231/reviews
// tourRouter
//   .route('/:tourID/reviews')
//   .post(
//     autheController.authorize,
//     autheController.restrictTo('user'),
//     reviewController.postReview
//   );
tourRouter.use('/:tourID/reviews', reviewRouter);

// tourRouter.param('id', tourController.checkID);
tourRouter
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
tourRouter.route('/stats').get(tourController.getStatistic);

tourRouter
  .route('/tourWithin/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);

tourRouter
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistanceToTour);

tourRouter
  .route('/monthly-plan/:year')
  .get(
    autheController.authorize,
    autheController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
tourRouter
  .route(`/`)
  .get(autheController.authorize, tourController.getAllTours)
  .post(
    autheController.authorize,
    autheController.restrictTo('admin', 'lead-guide'),
    tourController.addMoreTour
  );
tourRouter
  .route(`/:id`)
  .get(tourController.getSpecificTour)
  .patch(
    autheController.authorize,
    autheController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    autheController.authorize,
    autheController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = tourRouter;
