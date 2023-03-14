
const { response } = require('express');
var express = require('express');

const paypal = require('paypal-rest-sdk')
require('dotenv').config()
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
const userController = require('../controller/user-controller')

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.client_id,
    'client_secret': process.env.client_secret
});


console.log(process.env.client_id, "cliend id","client secret");
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

router.get('/delete-cart-product/:id', userController.getDeleteCartProduct)

router.post('/change-product-quantity', userController.verifyLogin, userController.getChangeProductQuantity)

router.get('/checkout', userController.getCheckOut)

router.get('/view-orders', userController.verifyLogin, userController.getViewOrder)

router.get('/pay',(req,res)=>{
    res.render('user/pay')
})

router.post('/pay2', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Red Sox Hat",
                    "sku": "001",
                    "price": "25.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "25.00"
            },
            "description": "Hat for the best team ever"
        }]
    };
    router.get('/success', (req, res) => {
        const payerId = req.query.PayerID;
        const paymentId = req.query.paymentId;

        const execute_payment_json = {
            "payer_id": payerId,
            "transactions": [{
                "amount": {
                    "currency": "USD",
                    "total": "25.00"
                }
            }]
        };

        paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
            if (error) {
                console.log(error.response);
                throw error;
            } else {
                console.log(JSON.stringify(payment));
                res.send('Success');
            }
        });
    });
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });

});
router.get('/cancel', (req, res) => res.send('Cancelled'));

 
  
  





module.exports = router;
