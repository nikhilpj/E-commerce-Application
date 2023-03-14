var productHelpers = require('../helpers/product-helpers')
var adminHelpers = require('../helpers/admin-helpers');
var categoryHelpers = require('../helpers/category-helpers');
const collection = require('../config/collection');
module.exports={
    getAddProduct : (req,res)=>{
        res.render('admin/add-product',{admin:true})
    },
    postAddProduct : (req,res)=>{
      if(req.session.adminLoggedIn)
      {
        console.log(req.body)
     console.log(req.files.image)
    productHelpers.addProduct(req.body,(id)=>{
    let Image = req.files.image
    Image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err)
      res.redirect('/admin/add-product')
      else
      console.log(err)
    })
    
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
        res.render('admin/add-category',{admin:true})
    },
    postAdminCategory :(req,res)=>{
        categoryHelpers.addCategory(req.body,(id)=>{
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
        res.render('admin/edit-product',{product,admin:true})
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
        console.log(category)
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

      getCoupon: (req,res)=>{
        if(req.session.adminLoggedIn)
        {
        res.render('admin/coupon-management',{admin:true})
        }
      },

      postCoupon: (req,res)=>{
        
      }
   
    

    }