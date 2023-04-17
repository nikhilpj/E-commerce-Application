
const { response } = require('express');
var express = require('express');

require('dotenv').config()
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
const userController = require('../controller/user-controller')

/* GET home page. */
router.get('/', userController.viewAllProducts),

    router.get('/login', userController.getLogin),

    router.get('/phone', userController.getPhone),

    router.post('/phone', userController.postPhone),

    router.get('/otp', userController.getOtp),

    router.post('/otp', userController.postOtp),

    router.get('/signup', userController.getSignup),

    router.post('/signup', userController.postSignup),

    router.post('/login', userController.postLogin),

    router.get('/logout', userController.getLogout)

router.get('/product-details/:id', userController.viewProductDetails)

router.get('/cart', userController.verifyLogin, userController.getCart)

router.get('/order', userController.verifyLogin, userController.getOrder)

router.post('/order', userController.postOrder)


router.get('/add-to-cart/:id', userController.verifyLogin, userController.getAddToCart)

router.get('/move-to-cart/:id',userController.verifyLogin,userController.getMovetoCart)

router.get('/add-to-wishlist/:id',userController.verifyLogin,userController.getAddtoWishlist)

router.get('/delete-cart-product/:id', userController.getDeleteCartProduct)

router.post('/change-product-quantity', userController.verifyLogin, userController.getChangeProductQuantity)

router.get('/apply-address/:id',userController.verifyLogin,userController.getApplyAddress)

router.post('/change-wishlist-quantity',userController.verifyLogin,userController.getChangewishquantity)

router.get('/checkout', userController.getCheckOut)

router.get('/view-orders', userController.verifyLogin, userController.getViewOrder)

router.get('/add-address',userController.verifyLogin,userController.getAddaddress)

router.post('/add-address',userController.verifyLogin,userController.postAddaddress)

router.get('/delete-address/:id',userController.verifyLogin,userController.getDeleteAddress)

router.get('/cancel-order/:id',userController.verifyLogin,userController.cancelOrder)

router.post('/apply-coupon/:id',userController.applycoupon)

router.get('/wishlist',userController.verifyLogin,userController.getwishlist)

router.get('/delete-wish-product/:id',userController.getDeletewishProduct)

router.post('/search',userController.getsearch)

router.get('/apply-category/:id',userController.getCategoryfilter)

router.get('/user-profile',userController.verifyLogin,userController.getProfile)



router.get('/pay',userController.verifyLogin,userController.pay)
    
   


router.post('/pay2',userController.verifyLogin,userController.postpay)

router.get('/cancel',userController.verifyLogin,userController.cancelpay) 

router.get('/success',userController.verifyLogin,userController.successpay)

 
  
  





module.exports = router;
