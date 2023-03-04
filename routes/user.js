const { response } = require('express');
var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
const userController = require('../controller/user-controller')

/* GET home page. */
router.get('/',userController.viewAllProducts),

router.get('/login',userController.getLogin),

router.get('/phone',userController.getPhone),

router.post('/phone',userController.postPhone),

router.get('/otp',userController.getOtp),

router.post('/otp',userController.postOtp),

router.get('/signup',userController.getSignup),

router.post('/signup',userController.postSignup),

router.post('/login',userController.postLogin),

router.get('/logout',userController.getLogout)

router.get('/product-details/:id',userController.viewProductDetails)

router.get('/cart',userController.verifyLogin,userController.getCart)

router.get('/order',userController.verifyLogin,userController.getOrder)

router.post('/order',userController.postOrder)

router.get('/add-to-cart/:id',userController.verifyLogin, userController.getAddToCart)

router.get('/delete-cart-product/:id',userController.getDeleteCartProduct)

router.post('/change-product-quantity',userController.verifyLogin,userController.getChangeProductQuantity)

router.get('/checkout',userController.getCheckOut)

router.get('/view-orders',userController.verifyLogin,userController.getViewOrder)




module.exports = router;
