const express = require('express');
const viewController = require('./../controller/viewController');
const authoController = require('./../controller/autheController');

const viewRouter = express.Router();

viewRouter.get('/me', authoController.authorize, viewController.getAccount);
viewRouter.get('/', authoController.isLogin, viewController.getOverview);
viewRouter.get('/tour/:slug', authoController.isLogin, viewController.getTour);
viewRouter.get('/login', authoController.isLogin, viewController.getLoginForm);
// viewRouter.post(
//   '/update-user',
//   authoController.authorize,
//   viewController.updateUser
// );
module.exports = viewRouter;
