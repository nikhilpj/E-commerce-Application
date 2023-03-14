var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt');
 require('dotenv').config()
const { response } = require('express');
const { log } = require('handlebars');
const {serviceSid } = require('../config/collection');
const { accountSid, authToken } = require('../config/collection');

const { resolve } = require('path');
const { error } = require('console');
const client = require('twilio')(accountSid,authToken)
var ObjectId = require("mongodb").ObjectId;



module.exports = {
    doSignup: (userData) => {

        return new Promise(async (resolve, reject) => {

            let verify =await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            console.log("this is verify",verify);
            if(verify)
            {
                console.log("user with same email exists");
                userData.usrstatus = false
                // resolve(userData.usrstatus)
            }
           else{

           
            userData.password = await bcrypt.hash(userData.password, 10)
            userData.usrstatus = true

         let user =   db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
               
                resolve(data.insertedId,user)
            })
        }
        })

    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                if (user.usrstatus) {
                    bcrypt.compare(userData.password, user.password).then((result) => {
                        if (result) {
                            console.log('login success')
                            response.user = user
                            response.status = true
                            resolve(response)
                        }


                        else {
                            console.log('login failed password incorrect')
                            response.status = false;
                            resolve(response)
                        }
                    })
                }
                else {
                    console.log("user is blocked")
                }
            }
            else
                console.log('login failed')
        })
    },
    addToCart: (proId, userId) => {
        
        let proObj = {
            item: ObjectId(proId),
            quantity: 1
        }
        console.log(proObj, ' #####');
        console.log(userId, '**');
        return new Promise(async (resolve, reject) => {
            console.log("fahiz");
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            console.log(userCart, '$$$$$');
            if (userCart) {
                let proExist = userCart.products.findIndex(products => products.item == proId)
                console.log(proExist)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                }
                else {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: proObj }
                        }
                    ).then((response) => {
                        resolve()
                    })
                }
            }
            else {
                console.log("hiiiii");
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }

                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }

        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
                // {
                //     $lookup: {
                //         from: collection.PRODUCT_COLLECTION,
                //         let: { proList: '$products' },
                //         pipeline: [{
                //             $match: {
                //                 $expr: {
                //                     $in: ['$_id', '$$proList']
                //                 }
                //             }
                //         }],
                //         as: 'cartItems'

                //     }
                // }
            ]).toArray()
            //console.log(cartItems[0].products, '@@@@@')
            resolve(cartItems)

        })

    },
    deleteCartProduct: (proId, userId) => {
        return new Promise((resolve, reject) => {
            console.log("for deleting product in cart")
            db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) }, { $pull: { products:{item: ObjectId(proId) }} }).then((response) => {
                console.log(response);
                resolve(response);
            })
        })


    },
    addProductQuantity: (prodId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection.CART_COLLECTION.updateOne({ user: ObjectId(userId) }, {
                $inc: { quantity: 1 }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart) },

                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })

            } else 
            {

                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }).then((response) => {
                        resolve({status:true})
                    })
            }
        })
    },
    getTotalAmount: (userId)=>{
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },

                {
                    $group: {
                        _id: null,
                        total : {$sum:{$multiply:['$quantity',{$toInt:'$product.price'}]}}
                    }
                }
               
                
            ]).toArray()
        
            console.log(total,+'god bless me');
            if(total[0]){
                resolve(total[0].total);
            } else {
                resolve(0);
            }


        })

    },
    placeOrder: (order,products,total)=>{

        return new Promise((resolve, reject) => {
            console.log(order,products,total,'to place order');
             let status = order['payment-method']==="cod"?"placed":"pending"
             let orderObj = {
                deliveryDetails:{
                    mobile:order.number,
                    address:order.address,
                    pincode:order.post
                },
                userId:ObjectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount : total,
                status:status,
                date : new Date().toISOString().slice(0, 10)
             }
             console.log("product details to show in order",orderObj.products);
             db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectId(order.userId)})
                console.log(orderObj, "this is orderobj" )
                console.log("response value after order");
                console.log("response in ajax ", response)
                resolve(response)
             })
        })

    },
    getCarProductList :(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            console.log("cart.products ",cart.products);
            resolve(cart.products)

        })
    },
  
    
    getOrderProducts: (userId)=>{
        return new Promise (async(resolve,reject)=>{
            let orders =await db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectId(userId)}).toArray()
           
              
            console.log("this is aggregating order cart to display ",orders);
            resolve(orders)
        })
    },
    verifyPhone: (userData)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({phone:userData.phone})
            console.log("this is user to verify phone ",user);
            if(user)
            {
                client.verify.v2
                .services(serviceSid)
                 .verifications.create({ to: `+91${userData.phone}`, channel: "sms" })
                .then((verification) => console.log(verification.status))
                .catch((error)=>console.log("this is the error while authorizing",error))
              
             response.user = user
             response.status = true  
             resolve(response) 
            }
            else{
                response.status= false
                resolve(response)
            }
        })
    },

    verifyOtp: (userData)=>{
        return new Promise((resolve,reject)=>{
            let otpCode = userData.otp
            let response={}
            console.log("this is the otp",otpCode);
           
            client.verify.v2 
        .services(serviceSid)
        .verificationChecks.create({ to:'+919383434361' , code: otpCode })
        .then((verification_check) =>{ console.log("this is status ",verification_check.status)
        console.log(verification_check.status,"huhu"); 
         response.status = verification_check.status 
        resolve(response)
    })
        // console.log("response.status after",response.status);
        // resolve(response)
        
            })

      
        
        

    }


}
