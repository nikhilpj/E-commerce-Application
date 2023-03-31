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
            db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) }, { $pull: { products: { item: ObjectId(proId) } } }).then((response) => {
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

            } else {

                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }).then((response) => {
                        resolve({ status: true })
                    })
            }
        })
    },

    applyAddress: (req, id) => {
        return new Promise((resolve, reject) => {
            let userid = req.session.user._id
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userid)},
            {
                $set:{
                    'address.$[].status':false 
                }
            }).then(()=>{

                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userid), 'address.Id': id }, {
                    $set: {
                        'address.$.status': true
                    }
                }, (err, result) => {
                    if (err) {
                        reject(err)
                    }
                    else {
                        resolve(result)
                    }
                
            })
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


        getTotalAmount: (userId) => {
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
                            total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } }
                        }
                    }


                ]).toArray()

                console.log(total, +'god bless me');
                if (total[0]) {
                    resolve(total[0].total);
                } else {
                    resolve(0);
                }


            })

        },
            placeOrder: (order, products, total) => {

                return new Promise((resolve, reject) => {
                    // console.log(order, products, total, 'to place order');
                    let status = order['payment-method'] === "cash-on-delivery" ? "placed" : "pending"
                    let orderObj = {
                        deliveryDetails: {
                            mobile: order.number,
                            address: order.address,
                            pincode: order.post
                        },
                        userId: ObjectId(order.userId),
                        paymentMethod: order['payment-method'],
                        products: products,
                        totalAmount: total,
                        status: status,
                        date: new Date().toISOString().slice(0, 10)
                    }
                    console.log("product details to show in order", orderObj.products);
                    if (status == 'placed') {
                        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })
                            // console.log(orderObj, "this is orderobj")
                            console.log("response value after order");
                            // console.log("response in ajax ", response)
                            resolve(response)
                        })


                    }
                    else {
                        // console.log("storing order data in session");
                        // request.session.order = orderObj
                        // console.log("session object for order",request.session.order);
                        resolve(response)
                    }
                })

            },

                placePaypal: (req, products, total) => {
                    console.log("pincode inside placepaypal", req.session.order.post);
                    return new Promise((resolve, reject) => {

                        let orderObj = {
                            deliveryDetails: {
                                mobile: req.session.order.number,
                                address: req.session.order.address,
                                pincode: req.session.order.post
                            },
                            userId: ObjectId(req.session.order.userId),
                            paymentMethod: req.session.order['payment-method'],
                            products: products,
                            totalAmount: total,
                            status: 'pending',
                            date: new Date().toISOString().slice(0, 10)
                        }

                        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(() => {
                            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(req.session.order.userId) })
                            console.log(orderObj, "this is orderobj in paypal")
                            console.log("response value after order");
                            console.log("response in ajax ", response)
                            resolve(orderObj)
                        }).catch((error) => {
                            reject(error)
                        })

                    })
                },

                    getCarProductList: (userId) => {
                        return new Promise(async (resolve, reject) => {
                            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
                            console.log("cart.products to move products in cart", cart.products);
                            resolve(cart.products)

                        })
                    },



                        getwishProductList: (userId) => {
                            return new Promise(async (resolve, reject) => {
                                let wish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
                                console.log("wishlist.products to move products in cart", wish.products);
                                resolve(wish.products)

                            })
                        },

                       


                            getOrderProducts: (userId) => {
                                return new Promise(async (resolve, reject) => {
                                    let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).toArray()

                                    for (let order of orders) {
                                        let products = []
                                        for (let item of order.products) {
                                          let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(item.item) })
                                          products.push({ name: product.name, quantity: item.quantity })
                                        }
                                        order.products = products
                                      }
                                    // console.log("this is aggregating order cart to display ", orders);
                                    resolve(orders)
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

                                        getCancelorder: (orderid) => {

                                            return new Promise(async (resolve, reject) => {
                                                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderid) },
                                                    {
                                                        $set: {
                                                            status: 'cancelled'
                                                        }
                                                    }).then((response) => {
                                                        console.log("response after updating ordr", response);
                                                        resolve(response)
                                                    })
                                            })
                                        },

                                            getAllcoupon: () => {
                                                return new Promise(async (resolve, reject) => {
                                                    let coupon = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
                                                    resolve(coupon)
                                                })
                                            },

                                                getApplyCoupon: (couponid, userid) => {
                                                    return new Promise(async (resolve, reject) => {

                                                        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userid) },
                                                            {
                                                                $set: {
                                                                    coupon_id: couponid,
                                                                    coupon_status: true
                                                                }
                                                            }).then((response) => {
                                                                console.log("response after inserting coupon in user", response);

                                                                resolve(response)
                                                            })


                                                    })

                                                },

                                                    postApplycoupon: (userid) => {
                                                        return new Promise(async (resolve, reject) => {
                                                            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userid) },
                                                                {
                                                                    $unset: {
                                                                        coupon_id: 1,
                                                                        coupon_status: 1
                                                                    }
                                                                })
                                                            console.log("deleting coupon from user collection");

                                                        })



                                                    },

                                                        getUser: (userid) => {
                                                            return new Promise(async (resolve, reject) => {
                                                                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userid) })
                                                                resolve(user)
                                                            })
                                                        },

                                                            getCoupondata: (couponid) => {
                                                                return new Promise(async (resolve, reject) => {
                                                                    let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ _id: ObjectId(couponid) })
                                                                    resolve(coupon)
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
