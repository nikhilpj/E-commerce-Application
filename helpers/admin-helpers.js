var db = require("../config/connection");
var collection = require("../config/collection");
var bcrypt = require("bcrypt");
const { response, resource } = require("../app");

var ObjectId = require("mongodb").ObjectId;

module.exports = {
    getAllUser: () => {
        return new Promise(async (resolve, reject) => {
            let user = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .find()
                .toArray();
            resolve(user);
        });
    },
    doBlock: (userID) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userID) }, {
                $set: {
                    usrstatus: false

                }
            }).then((response) => {
                resolve()
            })
        })
    },
    dounBlock: (userID) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userID) }, {
                $set: {
                    usrstatus: true

                }
            }).then((response) => {
                resolve()
            })
        })
    },
    doLogin: (adminData) => {
        return new Promise((resolve, reject) => {
            let data = collection.ADMIN_COLLECTION;
            console.log(adminData);
            if (data.name == adminData.name) {
                bcrypt.compare(adminData.password, data.password).then((loggedIn) => {

                    let response = {};
                    if (loggedIn) {
                        response.admin = data;
                        response.status = true;
                        resolve(response);
                    } else {
                        resolve({ status: false });
                    }
                });
            } else {
                console.log("not admin");
                resolve({ status: false });
            }
        });
    },
    getOrderList: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
               $match:{}
            },
        {
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

    getApproveOrder: (orderid) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderid) },
                {
                    $set: {
                        status: 'shipped'
                    }
                }).then((response) => {
                    resolve(response)
                })
        })

    },
    getOrderdeliverd: (orderid) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderid) },
                {
                    $set: {
                        status: 'deliverd'
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },
    addCoupon: (couponData) => {
        return new Promise((resolve, reject) => {
            couponData.status = true
            db.get().collection(collection.COUPON_COLLECTION).insertOne(couponData).then((response) => {
                resolve(response)
            })
        })
    },

    getblockCoupon: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id: ObjectId(id) },
                {
                    $set: {
                        status: false
                    }
                })
            resolve(response)
        })
    },

    getUnblockcoupon: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id: ObjectId(id) },
                {
                    $set: {
                        status: true
                    }
                })
            resolve(response)
        })
    },

    getCouponlist: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupons)
        })
    },

    getchartCount: () => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            response.cod = await db.get().collection(collection.ORDER_COLLECTION).find({ paymentMethod: "cash-on-delivery" }).count()
            response.on = await db.get().collection(collection.ORDER_COLLECTION).find({ paymentMethod: "on" }).count()
            resolve(response)
        })
    },

    weeklySales:(data)=>{
        let from = data.from
        let to = data.to
        return  new Promise(async(resolve,reject)=>{

            
           let Weekly_sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
                $match:{
                    date:{
                    $gte:from , $lte:to
                    }
                }},
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,products:{$arrayElemAt:['$products',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total: {
                            $sum: {$multiply:['$quantity', {$toInt: '$products.price'}]}
                          }
                    }
                }

            ]).toArray()
            resolve(Weekly_sales[0].total)
        })
            
    },

    Orders:(data)=>{
        let from = data.from
        let to = data.to
        return new Promise(async(resolve,reject)=>{

            let orders= await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
                $match:{
                    date:{$gte:from , $lte:to}
                }
            },
        {
            $sort:{
                date:-1
            }
        }]).toArray()
            for (let order of orders) {
                let products = []
                for (let item of order.products) {
                    let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(item.item) })
                    products.push({ name: product.name, quantity: item.quantity,price:product.price })
                }
                order.products = products
            }

            resolve(orders)
        })
        
    },

    Categorysales: () => {
        return new Promise(async (resolve, reject) => {
            let sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                { $unwind: "$products" },
                {
                    $lookup: {
                        from: "product",
                        localField: "products.item",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $group: {
                        _id: "$productDetails.category",
                        totalSales: { $sum: "$totalAmount" }
                    }
                }
            ]).toArray()
            resolve(sales)
        })
    }

}