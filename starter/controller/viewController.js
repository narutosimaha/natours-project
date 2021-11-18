const Tour = require('./../models/tourModel');
const catchAsync = require('./../ulities/catchSync');
const AppError = require('./../ulities/appError');
// const User = require('./../models/userModel');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res
    .status(200)
    // .set(
    //   'Content-Security-Policy',
    //   "connect-src 'self' https://cdnjs.cloudflare.com"
    // )
    .render('overview', {
      title: 'All Tours',
      tours
    });
});
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    field: 'review rating user'
  });
  if (!tour) {
    return next(new AppError('There is no tour with that name !', 404));
  }
  res.status(200).render('tour', {
    title: tour.name,
    tour: tour
  });
});

exports.getLoginForm = (req, res) => {
  res
    .status(200)
    // .set(
    //   'Content-Security-Policy',
    //   "connect-src 'self' https://cdnjs.cloudflare.com"
    // )
    .render('login', {
      title: 'Login'
    });
};
exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: `${req.user.name}`
  });
};

//BUTTON UPDATE METHOD
// exports.updateUser = catchAsync(async (req, res, next) => {
//   console.log(req.body);
//   console.log(req.user);
//   const userUpdate = await User.findByIdAndUpdate(
//     req.user._id,
//     {
//       name: req.body.name,
//       email: req.body.email
//     },
//     { new: true, runValidators: true }
//   );
//   console.log(userUpdate);
//   res.status(201).render('account', {
//     title: userUpdate.name,
//     user: userUpdate
//   });
// });
