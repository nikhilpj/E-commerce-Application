const { response } = require('../app');
const cartHelpers = require('../helpers/cart-helpers');
const categoryHelpers = require('../helpers/category-helpers');
const orderHelpers = require('../helpers/order-helpers');
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

    cartCount = await cartHelpers.getCartCount(req.session.user._id)

    let products = await cartHelpers.getCartProducts(req.session.user._id)

    let totalValue = await cartHelpers.getTotalAmount(req.session.user._id)
    let coupons = await cartHelpers.getAllcoupon()
    // console.log("coupons to show in cart ", coupons);
    // console.log(products, "products after performing aggregation")
    res.render('user/cart', { products, 'user': req.session.user._id, cartCount, totalValue, coupons })
  },

  getViewOrder: async (req, res) => {

    // let orderCount = null
    //orderCount =await userHelpers.getOrderCount(req.session.user._id)
    // let product = await 
    let orders = await orderHelpers.getOrderProducts(req.session.user._id)
    console.log(orders, "payment method to know to display orders ")
    res.render('user/view-orders', { user: req.session.user, orders })
  },

  getInvoice:(req,res)=>{
    let orderid = req.params.id
    let userid = req.session.user._id
    console.log("this is orderid in view orders for downloading invoice ",orderid);
    userHelpers.downloadInvoice(orderid,userid).then(()=>{
      res.redirect('/view-orders')
    })
  },

  getAddaddress: async (req, res) => {
    let orders = await orderHelpers.getOrderProducts(req.session.user._id)

    res.render('user/add-address', { user: req.session.user, orders })


  },

  postAddaddress: (req, res) => {
    console.log("user is", req.session.user._id);
    userid = req.session.user._id
    userHelpers.addAddress(req.body, userid).then(() => {
      console.log("response after adding address");
      res.redirect('/order')
    })
  },




  getOrder: async (req, res) => {
    let user = await userHelpers.getUser(req.session.user._id)
    // console.log("user data in order page ",user);
    let total = await cartHelpers.getTotalAmount(req.session.user._id)
    if(user.coupon_status)
    {
      let couponData = await orderHelpers.getCoupondata(user.coupon_id)
      total = total - (total * couponData.value)/100
    }
    
    res.render('user/order', { user: req.session.user, total,user })
  }
  ,
  postOrder: async (req, res) => {
    let products = await cartHelpers.getCarProductList(req.body.userId)
    let totalPrice = await cartHelpers.getTotalAmount(req.body.userId)
    //apply coupon here
    let userid = req.session.user._id
    let user = await userHelpers.getUser(userid)
    if (user.coupon_status == true) {
      let couponData = await orderHelpers.getCoupondata(user.coupon_id)
      totalPrice = totalPrice - (totalPrice * couponData.value) / 100
      console.log("discount amount ", totalPrice);

      console.log("coupon of user", user);
      orderHelpers.postApplycoupon(userid)
    }
    if (req.body['payment-method'] !== 'cash-on-delivery') {
      console.log("payment method is not cod so storing order data in session");
      req.session.order = req.body
      // console.log("this is session data of order", req.session.order);
    }

    orderHelpers.placeOrder(req.body, products, totalPrice, req.session.order).then((response) => {
      if (req.body['payment-method'] === 'cash-on-delivery') {
        res.json({ status: true })
        console.log("payment method cod");
      }
      else {
        res.json({ status: false })



      }

    })

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
    let categories= await userHelpers.getAllcatergories()
    console.log("categories for filter",categories);
    productHelpers.getAllProducts().then((products) => {
      res.render('user/main', { products, user ,categories})
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
  getAddToCart: async(req, res) => {

    console.log("to knoe detail of products", req.params.id);
    let product = await productHelpers.getProductDetails(req.params.id)
    console.log("details of produt to verify stock",product.stock);
    if(product.stock<=0)
    {
      
    }
    else
    {

    
    cartHelpers.addToCart(req.params.id, req.session.user._id).then(() => {

      res.redirect('/')
    })
  }
  },

  getMovetoCart: (req, res) => {
    console.log("to knoe detail of products in wishlist", req.params.id);
    userHelpers.moveToCart(req.params.id, req.session.user._id).then(() => {

      res.redirect('/')
    })
  },

  getDeleteCartProduct: (req, res) => {
    let proId = req.params.id
    console.log(req.params.id, "this is req.params.id from getdeletecartproduct")
    console.log("this is req.session.user._id", req.session.user._id)
    cartHelpers.deleteCartProduct(proId, req.session.user._id).then((response) => {
      res.redirect('/cart')
    })

  },
  getChangeProductQuantity: (req, res) => {
    console.log(req.body, "req.body of change product quantity");
    cartHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await cartHelpers.getTotalAmount(req.body.user)
      console.log("response in usercontroller",response);
      res.json(response)
    })
  },

  getApplyAddress:(req,res)=>{
    let id = req.params.id
    console.log(id,"id of address");
    orderHelpers.applyAddress(req,id).then(()=>{
      res.redirect('/order')
    }).catch((e)=>{
      console.log("error is ",e)
    })
  },

  getChangewishquantity: (req, res) => {
    console.log(req.body, "req.body of change wishlist quantity");
    userHelpers.changeQuantitywish(req.body).then(async (response) => {
      response.total = await userHelpers.getTotalAmount(req.body.user)
      console.log("response after change quantity wish", response);
      res.json(response)
    })
  },

  getProfile: async(req, res) => {
    let user = await userHelpers.getUser(req.session.user._id)
    res.render('user/user-profile',{ user: req.session.user ,user})
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
    orderHelpers.getCancelorder(orderid).then((response) => {
      res.redirect('/view-orders')
    })
  },

  applycoupon: async (req, res) => {
    // console.log(
    //   'sdfhdskjfgdskjfgdskgfksgfskjgfsjgfskjfgskfgskgfskgfksfhsdkgfskfgskfgskgfskfgkfgsk');
    console.log("id: " + req.params.id);
    console.log("user data ", req.session.user._id);
    cartCount = await cartHelpers.getCartCount(req.session.user._id)

    let products = await cartHelpers.getCartProducts(req.session.user._id)
    let totalValue = await cartHelpers.getTotalAmount(req.session.user._id)
    let couponData = await orderHelpers.getCoupondata(req.params.id)
    let discountValue =  (totalValue * couponData.value)/100
    totalValue = totalValue - discountValue
    let couponid = req.params.id
    cartHelpers.getApplyCoupon(couponid, req.session.user._id).then(() => {
      
      console.log("redirecting to cart after inserting coupon in user colleciton");
      
      res.render('user/cart',{totalValue,products,cartCount,discountValue,'user': req.session.user._id})
    })
    // let total = await userHelpers.getTotalAmount(req.session.user._id)
    // console.log("total from applycoupon",total);

  },

  getAddtoWishlist: (req, res) => {
    console.log("to knoe detail of products", req.params.id);
    userHelpers.addTowishlist(req.params.id, req.session.user._id).then(() => {

      res.redirect('/')
    })
  },

  getwishlist: async (req, res) => {
    let wishCount = null

    wishCount = await userHelpers.getwishCount(req.session.user._id)

    let products = await userHelpers.getwishlistProducts(req.session.user._id)

    // let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
    // let coupons = await userHelpers.getAllcoupon()
    // console.log("coupons to show in cart ", coupons);
    console.log(products, "products to show in wishlist")
    console.log("length of products in wishlist ", products.length);
    res.render('user/wishlist', { wishCount, products, 'user': req.session.user._id })
  },
  

  getDeletewishProduct: (req, res) => {
    let proId = req.params.id
    console.log(req.params.id, "this is req.params.id from getdeletewishproduct")
    console.log("this is req.session.user._id", req.session.user._id)
    userHelpers.deleteWishProduct(proId, req.session.user._id).then((response) => {
      res.redirect('/wishlist')
    })

  },

  getsearch: (req, res) => {
    console.log("req.body of search", req.body.search);
    productHelpers.searchproducts(req.body.search).then((products) => {
      console.log("respnsonse of search ", products);
      res.render('user/main', { products })
    })
  },

  getCategoryfilter:(req,res)=>{
    console.log("this is the id of category",req.params.id);
    let id = req.params.id
    categoryHelpers.CategoryFilter(id).then((products)=>{
      res.render('user/main',{products,'user': req.session.user._id})
    })

  },

  pay: (req, res) => {
    console.log("session data in payment ", req.session);
    let userid = req.session.user._id
    res.render('user/pay', { 'user': req.session.user._id })
  },

  postpay: async (req, res) => {

    // let orders = await userHelpers.getOrderProducts(req.session.user._id)
    // console.log("orders in payment ",orders);

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
    console.log("session data in successpay",req.session)


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
        res.send('error');
      } else {
        console.log(JSON.stringify(payment));

        cartHelpers.getCarProductList(req.session.user._id).then((products) => {
          cartHelpers.getTotalAmount(req.session.user._id).then((totalPrice) => {
 
            orderHelpers.placePaypal(req, products, totalPrice).then(() => {
              // res.send('Success');
              // console.log("productarr is ",productArr);
             
              res.render('user/success')
            }).catch((e) => {
              console.log(e);
              res.send('Error');
            });
          });
        });



      }
    });
  }




}