const express = require('express');

const userController = require(`./../controller/userController`);
const autheController = require(`./../controller/autheController`);
const userRouter = express.Router();

userRouter.post('/signup', autheController.signUp);
userRouter.post('/login', autheController.login);
userRouter.get('/logout', autheController.logout);
userRouter.post('/forgotPassword', autheController.forgotPassword);
userRouter.patch('/resetPassword/:token', autheController.resetPassword);

// Use this middleware to protect all of below middleware
userRouter.use(autheController.authorize);

userRouter.patch('/updatePassword', autheController.updatePassword);

userRouter.get(
  '/me',

  userController.getMe,
  userController.getUser
);
userRouter.patch(
  '/updateMe',
  userController.parsingPhoto,
  userController.cutImage,
  userController.updateMe
);
userRouter.delete('/me', userController.deleteMe);

userRouter.use(autheController.restrictTo('admin'));
//Do not update password with this route
userRouter
  .route(`/:id`)
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);
userRouter.route(`/`).get(userController.getAllUsers);

module.exports = userRouter;
