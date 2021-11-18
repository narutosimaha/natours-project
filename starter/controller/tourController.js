const Tour = require('./../models/tourModel');
const catchSync = require('./../ulities/catchSync');
const factory = require('./../controller/factoryHandler');
const AppError = require('./../ulities/appError');
// exports.checkID = (req, res, next, val) => {
//   const id = req.params.id * 1;
//   // if (!tours.find(el => el.id === id)) {
//   //   return res.status(404).json({
//   //     status: 'Failed',
//   //     message: 'Not found'
//   //   });
//   // }
//   next();
// };
exports.aliasTopTours = (req, res, next) => {
  console.log(req.query);
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// console.log(req.body);
// const newID = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newID }, req.body);
// tours.push(newTour);
// fs.writeFile(
//   `${__dirname}/dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   () => {
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour
//       }
//     });
//   }
// );

exports.getStatistic = catchSync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        averRating: { $avg: '$ratingsAverage' },
        averPrice: { $avg: '$price' },
        result: {
          $sum: 1
        },
        numRatings: { $sum: '$ratingsQuantity' },
        minPrice: { $max: '$price' },
        maxPrice: { $min: '$price' }
      }
    }
  ]);
  res.status(200).json({
    status: 'Success',
    requestDate: res.dateTime,
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchSync(async (req, res, next) => {
  const year = req.params.year * 1;
  const stats = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTour: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        numTour: -1,
        month: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'Success',
    requestDate: res.dateTime,
    data: {
      stats
    }
  });
});

// tourRouter
//   .route('/tourWithin/:distance/center/:latlng/unit/:unit')
//   .get(tourController.getTourWithin);
exports.getTourWithin = catchSync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const radius = unit === 'mi' ? distance / 3958.8 : distance / 6371;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longtitude in format: latitude,longtitude '
      )
    );
  }
  console.log(`Radius:${radius}`);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours
    }
  });
});
// tourRouter
//   .route('/distances/:latlng/unit/:unit')
//   .get(tourController.getDistanceToTour);
exports.getDistanceToTour = catchSync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longtitude in format: latitude,longtitude '
      )
    );
  }

  const tours = await Tour.aggregate([
    {
      //Automatically use geoNear for a field that we define 2dSphere index: startLocation
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours
    }
  });
});

exports.getAllTours = factory.getAll(Tour);

exports.getSpecificTour = factory.getOne(Tour, { path: 'reviews' });

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteModel(Tour);

exports.addMoreTour = factory.createOne(Tour);
