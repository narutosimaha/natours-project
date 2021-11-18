const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../ulities/catchSync');
const AppError = require('./../ulities/appError');
const factory = require('./../controller/factoryHandler');

// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, 'public/img/users');
//   },
//   filename: function(req, file, cb) {
//     const extension = file.mimetype.split('/')[1];
//     const name = `user-${req.user._id}-${Date.now()}.${extension}`;
//     cb(null, name);
//   }
// });

const storage = multer.memoryStorage();

const filterFile = function(req, file, cb) {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'This is not image file. Please use file with image extension'
      ),
      false
    );
  }
};

const multerImage = multer({
  storage: storage,
  fileFilter: filterFile
});

const filterObj = (body, ...field) => {
  const newObj = {};
  Object.keys(body).forEach(el => {
    if (field.includes(el)) {
      newObj[el] = body[el];
    }
  });
  return newObj;
};
exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.cutImage = (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  sharp(req.file.buffer)
    .resize({ width: 500, height: 500 })
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) Create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for updating password. Please use this route /updatePassword,',
        400
      )
    );
  }
  // 2) Filltered out unwanted fields name that are not allowed to be updated

  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // 3) Update user document
  const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(200).json({
    status: 'Success',
    data: null
  });
});

// exports.parsingPhoto = multerImage.single('photo');

exports.parsingPhoto = multerImage.single('photo');

exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteModel(User);
exports.updateUser = factory.updateOne(User);
exports.getAllUsers = factory.getAll(User);
