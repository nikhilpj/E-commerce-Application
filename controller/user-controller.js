const { response } = require('../app');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
const paypal = require('paypal-rest-sdk')
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.client_id,
  'client_secret': process.env.client_secret
});

module.exports = {
  getCart: async (req, res) => {
    let cartCount = null

    cartCount = await userHelpers.getCartCount(req.session.user._id)

    let products = await userHelpers.getCartProducts(req.session.user._id)

    let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
    let coupons = await userHelpers.getAllcoupon()
    console.log("coupons to show in cart ", coupons);
    console.log(products, "products after performing aggregation")
    res.render('user/cart', { products, 'user': req.session.user._id, cartCount, totalValue, coupons })
  },

  getViewOrder: async (req, res) => {

    // let orderCount = null
    //orderCount =await userHelpers.getOrderCount(req.session.user._id)
    // let product = await 
    let orders = await userHelpers.getOrderProducts(req.session.user._id)
    console.log(orders, "orders after aggregation ")
    res.render('user/view-orders', { user: req.session.user, orders })
  },

  getOrder: async (req, res) => {
    let total = await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/order', { user: req.session.user, total })
  }
  ,
   postOrder: async (req, res) => {
    let products = await userHelpers.getCarProductList(req.body.userId)
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
    //apply coupon here
    let userid = req.session.user._id
    let user = await userHelpers.getUser(userid)
    let couponData = await userHelpers.getCoupondata(user.coupon_id)
     totalPrice = totalPrice - (totalPrice * couponData.value)/100
    console.log("discount amount ",totalPrice );
    
    console.log("coupon of user",user);
    userHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
      if (req.body['payment-method'] === 'cod') {
        res.json({ status: true })
        console.log("payment method cod");
      }
      else {
        res.json({ status: false })



      }

    })
    console.log(req.body)
  }
  ,

  getSignup: (req, res) => {

    res.render('user/signup')
  },
  postSignup: (req, res) => {
    userHelpers.doSignup(req.body).then((response) => {
      console.log("respomse from signup", response);
      if (response) {
        req.session.loggedIn = true
        req.session.user = req.body
        console.log(req.body.firstname);
        console.log("user name" + response.user)
        res.redirect('/')
      }
      else {
        res.redirect('/signup')
      }
    })

  },


  getLogin: (req, res) => {
    let user = req.session.user


    if (req.session.loggedIn == true) {
      res.redirect('/')
    }
    else {


      res.render('user/login', { loginErr: req.session.loginErr })
      console.log('!!!!!!!');
      // res.render('user/login', { loginErr: req.session.loginErr ,user})
      req.session.loginErr = false


    }
  },

  getLogout: (req, res) => {
    req.session.destroy()
    res.redirect('/')
  }
  ,
  postLogin: (req, res) => {
    userHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.loggedIn = true
        req.session.user = response.user
        console.log('redirecting to home page')
        res.redirect('/')
      }
      else
        req.session.loginErr = true
      res.redirect('/login')
    })

  },
  viewAllProducts: async (req, res) => {
    console.log("*****");
    let user = req.session.user

    productHelpers.getAllProducts().then((products) => {
      res.render('user/main', { products, user })
    })
  },
  viewProductDetails: async (req, res) => {

    let product = await productHelpers.getProductDetails(req.params.id)
    res.render('user/product-details', { product, user: req.session.user })
  },
  verifyLogin: (req, res, next) => {
    if (req.session.loggedIn)

      next()
    else
      res.redirect('/login')


  },
  getAddToCart: (req, res) => {
    console.log("to knoe detail of products", req.params.id);
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {

      res.redirect('/')
    })
  },
  getDeleteCartProduct: (req, res) => {
    let proId = req.params.id
    console.log(req.params.id, "this is req.params.id from getdeletecartproduct")
    console.log("this is req.session.user._id", req.session.user._id)
    userHelpers.deleteCartProduct(proId, req.session.user._id).then((response) => {
      res.redirect('/cart')
    })

  },
  getChangeProductQuantity: (req, res) => {
    console.log(req.body, "req.body of change product quantity");
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await userHelpers.getTotalAmount(req.body.user)
      res.json(response)
    })
  },
  getCheckOut: (req, res) => {
    res.render('user/checkout', { user: req.session.user })
  },

  getPhone: (req, res) => {
    res.render('user/phone')
  },

  postPhone: (req, res) => {
    userHelpers.verifyPhone(req.body).then((response) => {
      // let result = response

      if (response.status) {

        console.log('user exists ,redirecting to otp page')
        console.log("user data passed to otp page ", response);
        req.session.data = response.user
        res.redirect('/otp')
      }
      else
        req.session.loginErr = true
      res.redirect('/phone')
    })

  },
  getOtp: (req, res) => {
    res.render('user/otp')
  },
  postOtp: (req, res) => {
    console.log("hey bro how are you");
    console.log("contains data of user");
    userHelpers.verifyOtp(req.body).then((response) => {
      console.log(response, "haha");
      if (response.status == 'approved') {
        req.session.loggedIn = true
        req.session.user = req.session.data
        console.log("login success");

        res.redirect('/')
      }
      else {
        req.session.destroy()
        res.redirect('/login')
      }

    })

  },

  cancelOrder: (req, res) => {
    let orderid = req.params.id
    userHelpers.getCancelorder(orderid).then((response) => {
      res.redirect('/view-orders')
    })
  },

  applycoupon: async (req, res) => {
    // console.log(
    //   'sdfhdskjfgdskjfgdskgfksgfskjgfsjgfskjfgskfgskgfskgfksfhsdkgfskfgskfgskgfskfgkfgsk');
    console.log("id: "+req.params.id);
    console.log("user data ",req.session.user._id);
    let couponid = req.params.id
    userHelpers.getApplyCoupon(couponid,req.session.user._id).then(()=>{
      console.log("redirecting to cart after inserting coupon in user colleciton");
      res.redirect('/cart')
    })
    // let total = await userHelpers.getTotalAmount(req.session.user._id)
    // console.log("total from applycoupon",total);
    
  },

  pay: (req, res) => {
    res.render('user/pay')
  },

  postpay: (req, res) => {
    
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
  },

  cancelpay: (req, res) => {
    res.send('cancelled')
  },
  successpay: (req, res) => {
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
  }




}