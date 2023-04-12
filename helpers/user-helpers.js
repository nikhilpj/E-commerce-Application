var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt');
require('dotenv').config()
const { response } = require('express');
const { log } = require('handlebars');
const { serviceSid } = require('../config/collection');
const { accountSid, authToken } = require('../config/collection');

const { resolve } = require('path');
const { error } = require('console');
const { request } = require('http');
const client = require('twilio')(accountSid, authToken)
var ObjectId = require("mongodb").ObjectId;



module.exports = {
    doSignup: (userData) => {

        return new Promise(async (resolve, reject) => {

            let verify = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            console.log("this is verify", verify);
            if (verify) {
                console.log("user with same email exists");
                userData.usrstatus = false

                // resolve(userData.usrstatus)
            }
            else {


                userData.password = await bcrypt.hash(userData.password, 10)
                userData.usrstatus = true

                let user = db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {

                    resolve(data.insertedId, user)
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

    addAddress: (addressdetail, userid) => {
        return new Promise(async (resolve, reject) => {

            const currentDate = new Date();
            const addressId = currentDate.getTime().toString();
            console.log("unique id of address", addressId);
            console.log("addres to add", addressdetail);
            let addresslist = {
                country: addressdetail.country_name,
                address: addressdetail.address,
                pincode: addressdetail.post,
                Id: addressId,
                status: false
            }
            console.log("user is", userid);
            let addr = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userid) })

            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userid) },
                {
                    $push: { address: addresslist }
                }
            ).then(() => {
                resolve()
            })

            // else {
            //     db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(req.session.user._id) },
            //         {
            //             $set: { address: [addressdetail] }
            //         }
            //     ).then(() => {
            //         resolve()
            //     })
            // }

        })
    },



   

    moveToCart: (proId, userId) => {

        console.log("inside function to delete wishlist");
        console.log("749278028475847582798472098");
        let proObj = {
            item: ObjectId(proId),
            quantity: 1
        }
        // console.log(proObj, ' #####');
        // console.log(userId, '**');
        return new Promise(async (resolve, reject) => {
            // console.log("fahiz");
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            // console.log(userCart, '$$$$$');
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
                // console.log("hiiiii");
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }

                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    console.log("deleting products from wsihlist");

                    resolve()
                })

            }
            db.get().collection(collection.WISHLIST_COLLECTION).deleteOne({ user: ObjectId(userId) })

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
    
    

    changeQuantitywish: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ _id: ObjectId(details.wish) },

                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })

            } else {

                db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ _id: ObjectId(details.wish), 'products.item': ObjectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }).then((response) => {
                        resolve({ status: true })
                    })
            }
        })
    },


    getwishProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
            console.log("wishlist.products to move products in cart", wish.products);
            resolve(wish.products)

        })
    },



    verifyPhone: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: userData.phone })
            console.log("this is user to verify phone ", user);
            if (user) {
                client.verify.v2
                    .services(serviceSid)
                    .verifications.create({ to: `+91${userData.phone}`, channel: "sms" })
                    .then((verification) => console.log(verification.status))
                    .catch((error) => console.log("this is the error while authorizing", error))

                response.user = user
                response.status = true
                resolve(response)
            }
            else {
                response.status = false
                resolve(response)
            }
        })
    },

    verifyOtp: (userData) => {
        return new Promise((resolve, reject) => {
            let otpCode = userData.otp
            let response = {}
            console.log("this is the otp", otpCode);

            client.verify.v2
                .services(serviceSid)
                .verificationChecks.create({ to: '+919383434361', code: otpCode })
                .then((verification_check) => {
                    console.log("this is status ", verification_check.status)
                    console.log(verification_check.status, "huhu");
                    response.status = verification_check.status
                    resolve(response)
                })
            // console.log("response.status after",response.status);
            // resolve(response)

        })

    },

 

    getUser: (userid) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userid) })
            resolve(user)
        })
    },

   

    addTowishlist: (proId, userId) => {

        let proObj = {
            item: ObjectId(proId),
            quantity: 1
        }
        console.log(proObj, ' addwish');
        console.log(userId, '**');
        return new Promise(async (resolve, reject) => {
            console.log("jkk");
            let userwishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
            console.log(userwishlist, '....');
            if (userwishlist) {
                let proExist = userwishlist.products.findIndex(products => products.item == proId)
                console.log(proExist)
                if (proExist != -1) {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                }
                else {

                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: proObj }
                        }
                    ).then((response) => {
                        resolve()
                    })
                }
            }
            else {
                console.log("hwuuu");
                let wishObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }

                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response) => {
                    resolve()
                })
            }

        })
    },

    getwishCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let wish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
            if (wish) {
                count = wish.products.length
            }
            resolve(count)
        })
    },

    getAllcatergories: () => {
        return new Promise(async (resolve, reject) => {
            try {


                let categories = await db.get().collection(collection.CATEGORY_MANAGEMENT).find({}).toArray()
                resolve(categories)


            } catch (e) {
                console.log("error is ", e);
                reject(e)
            }
        })
    },

    getwishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
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
              
            ]).toArray()
            //console.log(cartItems[0].products, '@@@@@')
            resolve(wishItems)

        })

    },

    deleteWishProduct: (proId, userId) => {
        return new Promise((resolve, reject) => {
            console.log("for deleting product in wishlist")
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) }, { $pull: { products: { item: ObjectId(proId) } } }).then((response) => {
                console.log(response);
                resolve(response);
            })
        })


    },


}
