const AppError = require('./../ulities/appError');
const catchAsync = require('./../ulities/catchSync');
const ApiFeatures = require('./../ulities/apiFeatures');

exports.deleteModel = Model =>
  catchAsync(async (req, res, next) => {
    console.log('hey');
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('Can not find the document with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      message: 'Delete successful'
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(new AppError('Can not find the document with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, populateOption) =>
  catchAsync(async (req, res, next) => {
    // console.log(req.params);
    let query = Model.findById(req.params.id);
    if (populateOption) query = query.populate(populateOption);

    const doc = await query;
    if (!doc) {
      return next(new AppError('Can not find the document with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //BUILD QUERY

    //Get review of coresponding tour with id (HACK)
    let filter = {};
    if (req.params.tourID) filter = { tour: req.params.tourID };
    //ASSIGN PROMISE
    const service = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();
    //EXECUTE QUERY

    const doc = await service.query;

    res.status(200).json({
      status: 'Success',
      requestDate: res.dateTime,
      result: doc.length,
      data: {
        data: doc
      }
    });
  });
