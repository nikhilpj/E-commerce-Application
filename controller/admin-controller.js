
var productHelpers = require('../helpers/product-helpers')
var adminHelpers = require('../helpers/admin-helpers');
var categoryHelpers = require('../helpers/category-helpers');
const collection = require('../config/collection');
const { response } = require('../app');
module.exports={
    getAddProduct : (req,res)=>{
      categoryHelpers.getAllCategory().then((categories)=>{
        res.render('admin/add-product',{admin:true,categories})
      })
       
      
        
    },
    postAddProduct : (req,res)=>{
      if(req.session.adminLoggedIn)
      {
        console.log(req.body,"this is req.body in add product")
     console.log("next",req.files.image1,"this is req.files.image")
     console.log("image2",req.files.image2)
     console.log('image3',req.files.image3)
    productHelpers.addProduct(req.body,(id)=>{
    let Image = req.files.image
    let image2 = req.files.image1
    let image3= req.files.image2
    Image.mv('./public/product-images/'+id+'.jpg')
    image2.mv('./public/product-images/'+id+1+'.jpg')
    image3.mv('./public/product-images/'+id+2+'.jpg')
    // (err,done)=>{
    //   if(!err)
    //   res.redirect('/admin/product-management')
    //   else
    //   console.log(err)
    // })
    res.redirect('/admin/product-management')
    
  })
}
else
res.redirect('/admin/admin-login')
},

getDeleteProduct :(req,res)=>{
    let proId = req.params.id
    productHelpers.deleteProduct(proId).then((response)=>{
      
      res.redirect('/admin/product-management')
    })
  
  }, 

    adminLogin : (req,res)=>{
        res.render('admin/admin-login')
    },
    adminCategory : (req,res)=>{
        res.render('admin/add-category',{admin:true,categoryErr: req.session.loginErr})
    },
    postAdminCategory :(req,res)=>{
        categoryHelpers.addCategory(req.body).then(()=>{
          
            res.redirect('/admin/category-management')
          
          
        })
         
      
      },
    allProducts : (req,res)=>{
        productHelpers.getAllProducts().then((products)=>{
            res.render('admin/product-management',{admin:true,products})
          })  
    },
    allUsers : (req,res)=>{
      console.log('lkjhg');
     if(req.session.adminLoggedIn)
     {
        adminHelpers.getAllUser().then((users) => {
            res.render("admin/home", {admin:true,users});
          });
        }
        else{
          res.redirect('/admin/admin-login')
        }
    },
    getEditProduct :  async (req,res)=>{
        let product =await productHelpers.getProductDetails(req.params.id)
        console.log(product)
        categoryHelpers.getAllCategory().then((categories)=>{
        res.render('admin/edit-product',{product,admin:true,categories})
        })
      },
      postEditProduct : (req,res)=>{
        let id =req.params.id
        productHelpers.updateProduct(req.params.id,req.body).then(()=>{
          console.log('hao')
          res.redirect('/admin/product-management')
         
          if(req.files.image)
          {
            let Image = req.files.image
            Image.mv('./public/product-images/'+id+'.jpg')
          }
          if(req.files.image1)
          {
            let Image1 = req.files.image1
            Image1.mv('./public/product-images/'+id+1+'.jpg')
          }
          if(req.files.image2)
          {
            let Image2 = req.files.image2
            Image2.mv('./public/product-images/'+id+2+'.jpg')
          }


        })
      },
      getBlockUser : (req,res)=>{
        if(req.session.adminLoggedIn==true)
        {
        let userID = req.params.id
        adminHelpers.doBlock(userID).then((response)=>{
          res.redirect('/admin')
        })
      }
      },
      unBlockUser : (req,res)=>{
        let userID= req.params.id
        adminHelpers.dounBlock(userID).then((response)=>{
          res.redirect('/admin')
        })
       
      },
      getCategory : (req,res)=>{
        if(req.session.adminLoggedIn)
        {
        categoryHelpers.getAllCategory().then((categories)=>{
          res.render('admin/category-management',{admin:true,categories})
        })
      }else{
        res.redirect('/admin/admin-login')
      }
        
      },
      getAdminLogin : (req,res)=>{
        if(req.session.adminLoggedIn){
          res.redirect("/admin");
        }
        else{
          res.render('admin/admin-login',{ loginErr: req.session.loginErr,adminLoggedOut:true,admin:true })
          req.session.loginErr = false;
        }
       
      },
      postAdminLogin : (req, res)=>{
        adminHelpers.doLogin(req.body).then((response) => {
          if (response.status) {
            req.session.adminLoggedIn = true;
            req.session.admin = response.admin;
          
            res.redirect("/admin");
      
          } else {
            req.session.loginErr = true;
            res.redirect("/admin/admin-login");
          }
        });
      },

      getEditCategory : async (req,res)=>{
        
        console.log(req.params.id,"rttttt")

        let category =await categoryHelpers.getcategoryDetails(req.params.id)
        console.log("full data of all categories ",category)
        res.render('admin/edit-category',{category,admin:true})
      },
      postEditCategory : (req,res)=>{
         let id =req.params.id
        categoryHelpers.updateCategory(req.params.id,req.body).then(()=>{
         
          res.redirect('/admin/category-management')
         
        })
      },
      getDeleteCategory : (req,res)=>{
        let categoryId = req.params.id
        categoryHelpers.deleteCategory(categoryId).then((response)=>{
          res.redirect('/admin/category-management')
        })
      
      },
      getDashBoard :(req,res)=>{
        
        if(req.session.adminLoggedIn)
        {
        res.render('admin/dashboard',{admin:true})
        }
        else{
          res.redirect('/admin/admin-login')
        }
      },
      getAllOrders : (req,res)=>{
        if(req.session.adminLoggedIn)
        {
          adminHelpers.getOrderList().then((orders)=>{
            
            res.render('admin/order-management',{admin:true,orders})
          })
       
      }
      else{
        res.redirect('/admin/admin-login')
      }
      
      }
      ,

      getLogout :(req,res)=>{
        req.session.destroy()
        console.log("logouting from admin");
        res.redirect('/admin/admin-login')
      },

      addCoupon: (req,res)=>{
        if(req.session.adminLoggedIn)
        {
        res.render('admin/add-coupon',{admin:true})
        }
      },

      postAddCoupon: (req,res)=>{

        adminHelpers.addCoupon(req.body).then((response)=>{
          res.redirect('/admin/add-coupon')

        })
        
      },

      cancelOrder :(req,res)=>{
        if(req.session.adminLoggedIn)
        {
        let orderid = req.params.id
        console.log("orderid to cancel",orderid);
        adminHelpers.getCancelorder(orderid).then((response)=>{
          res.redirect('/admin/order-management')
        })

        }

      },

      approveOrder: (req,res)=>{

        if(req.session.adminLoggedIn)
        {
          let orderid =req.params.id
          adminHelpers.getApproveOrder(orderid).then((response)=>{
            res.redirect('/admin/order-management')
          })
        }
        
      },

      deliverOrder: (req,res)=>{

        
        if(req.session.adminLoggedIn)
        {
          let orderid =req.params.id
          adminHelpers.getOrderdeliverd(orderid).then((response)=>{
            res.redirect('/admin/order-management')
          })
        }
        
      },

      blockCoupon:(req,res)=>{
        let coupon_id = req.params.id
        adminHelpers.getblockCoupon(coupon_id).then((response)=>{
          res.redirect('/admin/coupon-management')
        })

        },

        unbockCoupon:(req,res)=>{
          let coupon_id = req.params.id
          adminHelpers.getUnblockcoupon(coupon_id).then((response)=>{
            res.redirect('/admin/coupon-management')
          })
        },
      

      getCoupon: (req,res)=>{
        if(req.session.adminLoggedIn)
        {
          adminHelpers.getCouponlist().then((coupons)=>{

          
          res.render('admin/coupon-management',{admin:true,coupons})
        })
        }
      },

      getChart : (req,res)=>{
        if(req.session.adminLoggedIn)
        {
          adminHelpers.getchartCount().then((response)=>{
            res.render('admin/chart',{admin:true,response})
          })
          
        }
      },

      getWeeklySales:(req,res)=>{
        if(req.session.adminLoggedIn)
        {
          
         
            // console.log("weekly sales = ",sales)
            res.render('admin/weekly-sales',{admin:true})
          }
        }
      ,

      postWeeklySales:async(req,res)=>{
        console.log("data in choosing date for weekly sales",req.body)
        let orders = await adminHelpers.Orders(req.body)
        let totalSales=  await adminHelpers.weeklySales(req.body)
        console.log("total is ",totalSales)
        res.render('admin/weekly-sales',{admin:true,orders,totalSales})
      },

      getCategorysales:async(req,res)=>{
        if(req.session.adminLoggedIn)
        {
          let categorySales = await adminHelpers.Categorysales()
            console.log("category wise sales is",categorySales);
            res.render('admin/sales',{admin:true,categorySales})
          
          
        }
      }
   
    

    }