const { response } = require('express');
var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var adminHelpers = require('../helpers/admin-helpers');
const userHelpers = require('../helpers/user-helpers');
var categoryHelpers = require('../helpers/category-helpers');
const adminController = require('../controller/admin-controller');
const { getDeleteProduct } = require('../controller/admin-controller');
const userController = require('../controller/user-controller');

/* GET users listing. */
router.get('/', adminController.allUsers)
  

router.get('/product-management',adminController.allProducts)
 
  
router.get('/add-product',adminController.getAddProduct)

router.post('/add-product',adminController.postAddProduct)
  
router.get('/delete-product/:id',adminController.getDeleteProduct)

router.get('/edit-product/:id',adminController.getEditProduct)

router.post('/edit-product/:id',adminController.postEditProduct)

//user management


router.get('/block-user/:id',adminController.getBlockUser)

router.get('/unblock-user/:id',adminController.unBlockUser)


router.get('/admin-login',adminController.getAdminLogin)

router.post("/admin-login", adminController.postAdminLogin  );

router.get('/logout',adminController.getLogout)
//category

router.get('/category-management',adminController.getCategory)

router.get('/add-category',adminController.adminCategory)

router.post('/add-category',adminController.postAdminCategory)

router.get('/edit-category/:id', adminController.getEditCategory)

router.post('/edit-category/:id',adminController.postEditCategory)

router.get('/delete-category/:id',adminController.getDeleteCategory)

router.get('/dashboard',adminController.getDashBoard)

router.get('/order-management',adminController.getAllOrders)




module.exports = router;
