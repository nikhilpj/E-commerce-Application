var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt');
require('dotenv').config()
const { response } = require('express');
const { log } = require('handlebars');
const { resolve } = require('path');
const { error } = require('console');
const { request } = require('http');
var ObjectId = require("mongodb").ObjectId;

module.exports={

    getCoupondata: (couponid) => {
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ _id: ObjectId(couponid) })
            resolve(coupon)
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

        })

    },

    placeOrder: (order, products, total) => {

        return new Promise((resolve, reject) => {
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
            if (status == 'placed') {
                db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })
                    resolve(response)
                })

            }
            else {
                resolve(response)
            }
        })

    },

    getOrderProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
                $match:{
                    userId:ObjectId(userId)
                }
            },{
                $sort:{
                    date:-1
                }
            }]).toArray()

            for (let order of orders) {
                let products = []
                for (let item of order.products) {
                    let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(item.item) })
                    products.push({ name: product.name, quantity: item.quantity })
                }
                order.products = products
            }
            resolve(orders)
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


    placePaypal: (req, products, total) => {
        let productArr=[]
        return new Promise(async(resolve, reject) => {

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
           
            for(let item of orderObj.products)
            {
                let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(item.item)})
                productArr.push({name:product.name,quantity:item.quantity})
        
            }
            let user= await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(orderObj.userId)})
            if(user.coupon_status)
            {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(orderObj.userId) },
                {
                    $unset: {
                        coupon_id: 1,
                        coupon_status: 1
                    }
                })
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(() => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(req.session.order.userId) })
                resolve()
            }).catch((error) => {
                reject(error)
            })

        })
    },

    deleteAddress:(addressId,userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},{
                $pull:{
                    address:{Id:addressId}
                }
            }).then(()=>{
                resolve()
            })
        })

    },

    applyAddress: (req, id) => {
        return new Promise((resolve, reject) => {
            let userid = req.session.user._id
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userid) },
                {
                    $set: {
                        'address.$[].status': false
                    }
                }).then(() => {

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
}