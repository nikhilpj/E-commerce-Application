var db = require('../config/connection')
var collection = require('../config/collection')
const { response } = require('express')
const { ObjectId } = require('mongodb')
var objectId = require('mongodb').ObjectID

module.exports={

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

    getTotalAmountPaypal: (userId) => {
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

                let user = await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)})
                console.log("user data in gettotalamountpaypal ",user)
                if(user.coupon_status)
                {
                    let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ _id: ObjectId(user.coupon_id) })
                    console.log("coupon details in placepaypal to know its value",coupon)
                    total[0].total = total[0].total - (total[0].total * coupon.value)/100
                }
                
                resolve(total[0].total);
            } else {
                resolve(0);
            }


        })

    },

    getAllcoupon: () => {
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupon)
        })
    },


    addToCart: (proId, userId) => {

        let proObj = {
            item: ObjectId(proId),
            quantity: 1
        }
        console.log(proObj, 'this is prod uct object in add to cart');
        console.log(userId, 'this is usserid');
        return new Promise(async (resolve, reject) => {
            console.log("fahiz");
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            console.log(userCart, '$$$$$');
            if (userCart) {
                let proExist = userCart.products.findIndex(products => products.item == proId)
                console.log(proExist)

                if (proExist != -1) {
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(proId) }, {
                        $inc: { stock: -1 }
                    })
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                }
                else {
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(proId) }, {
                        $inc: { stock: -1 }
                    })
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
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(proId) }, {
                    $inc: { stock: -1 }
                })

                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }

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

    changeProductQuantity: (details) => {
        console.log("details in cart to change stock", details);
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)


        return new Promise(async(resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart) },

                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }
                ).then((response) => {
                    console.log("response to removeproduct", response);
                    resolve({ removeProduct: true })
                })
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(details.product) }, {

                    $inc: { stock: 1 }

                })

            } else {
                let verifyStock =await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(details.product) })
                console.log("verifystock = ",verifyStock);
                if(verifyStock.stock==0 && details.count==1)
                {
                    console.log("stock empty");
                   
                }

                else
                {

               
                if (details.count == 1) {

                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(details.product) }, {

                        $inc: { stock: -1 }

                    })

                }
                else {
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(details.product) }, {

                        $inc: { stock: 1 }

                    })
                }
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }).then((response) => {

                        resolve({ status: true })
                    })
                }
            }
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

    getCarProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            console.log("cart.products to move products in cart", cart.products);
            resolve(cart.products)

        })
    },
}