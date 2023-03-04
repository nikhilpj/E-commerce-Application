const { response } = require('../app');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
module.exports = {
  getCart: async (req, res) => {
    let cartCount = null

    cartCount = await userHelpers.getCartCount(req.session.user._id)
   
    let products = await userHelpers.getCartProducts(req.session.user._id)
    let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
    console.log(products,"products after performing aggregation")
    res.render('user/cart', { products, 'user': req.session.user._id, cartCount ,totalValue})
  },

  getViewOrder:async(req,res)=>{

   // let orderCount = null
    //orderCount =await userHelpers.getOrderCount(req.session.user._id)
    let orders = await userHelpers.getOrderProducts(req.session.user._id)
    console.log(orders,"orders after aggregation ")
    res.render('user/view-orders',{user: req.session.user,orders})
  },

  getOrder: async(req, res) => {
    let total = await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/order',{ user: req.session.user,total})
  }
  ,
  postOrder: async(req,res)=>{
    let products= await userHelpers.getCarProductList(req.body.userId)
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
    userHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
        res.json({status:true})

    })
    console.log(req.body)
}
  ,

  getSignup: (req, res) => {

    res.render('user/signup')
  },
  postSignup: (req, res) => {
    userHelpers.doSignup(req.body).then((response) => {
      console.log("respomse from signup",response);
      if(response)
      {
      req.session.loggedIn = true
      req.session.user = req.body
     console.log(req.body.firstname);
      console.log("user name"+response.user)
      res.redirect('/')
      }
      else{
        res.redirect('/signup')
      }
    })

  },


  getLogin: (req, res) => {   
     let user = req.session.user


    if (req.session.loggedIn == true) {
      res.redirect('/')
    }
    else{
      

      res.render('user/login')
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
  viewAllProducts: async (req, res) => {console.log("*****");
    let user = req.session.user

    productHelpers.getAllProducts().then((products) => {
      res.render('user/main', { products, user })
    })
  },
  viewProductDetails: async (req, res) => {
  
    let product = await productHelpers.getProductDetails(req.params.id)
    res.render('user/product-details', { product ,user:req.session.user})
  },
  verifyLogin: (req, res, next) => {
    if (req.session.loggedIn)

      next()
    else
      res.redirect('/login')


  },
  getAddToCart: (req, res) => {
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    
      res.redirect('/')
    })
  },
  getDeleteCartProduct: (req, res) => {
    let proId = req.params.id
    console.log(req.params.id,"this is req.params.id from getdeletecartproduct")
    console.log("this is req.session.user._id",req.session.user._id)
    userHelpers.deleteCartProduct(proId, req.session.user._id).then((response) => {
      res.redirect('/cart')
    })

  },
  getChangeProductQuantity: (req, res) => {
    console.log(req.body,"req.body of change product quantity");
    userHelpers.changeProductQuantity(req.body).then(async(response) => {
       response.total = await userHelpers.getTotalAmount(req.body.user)
      res.json(response)
    })
  },
  getCheckOut : (req,res)=>{
    res.render('user/checkout',{user:req.session.user})
  },

  getPhone: (req,res)=>{
    res.render('user/phone')
  },

  postPhone:(req,res)=>{
    userHelpers.verifyPhone(req.body).then((response) => {
      // let result = response
      
      if (response.status) {
        
        console.log('user exists ,redirecting to otp page')
        console.log("user data passed to otp page ",response);
        req.session.data = response.user
        res.redirect('/otp')
      }
      else
        req.session.loginErr = true
      res.redirect('/phone')
    })

  },
  getOtp: (req,res)=>{
    res.render('user/otp')
  },
  postOtp: (req,res)=>{
    console.log("hey bro how are you");
    console.log("contains data of user");
    userHelpers.verifyOtp(req.body).then((response)=>{
      console.log(response,"haha");
      if(response.status=='approved')
      {
         req.session.loggedIn = true
         req.session.user = req.session.data
      console.log("login success");
      
      res.redirect('/')
      }
      else{
        req.session.destroy()
        res.redirect('/login')
      }

    })

  }

  


}