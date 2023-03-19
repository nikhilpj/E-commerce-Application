var db = require("../config/connection");
var collection = require("../config/collection");
var bcrypt = require("bcrypt");
const { response } = require("../app");

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
            console.log("user is"+user)
        });
    },
    doBlock : (userID)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userID)},{
             $set:{
               usrstatus : false
    
             }   
            }).then((response)=>{
                resolve()
            })
        })
    },
    dounBlock : (userID)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userID)},{
             $set:{
               usrstatus : true
    
             }   
            }).then((response)=>{
                resolve()
            })
        })
    },
    doLogin: (adminData) => {
        return new Promise((resolve, reject) => {
            let data = collection.ADMIN_COLLECTION;
            console.log(adminData);
            if (data.name == adminData.name) {
                console.log(adminData);
                bcrypt.compare(adminData.password, data.password).then((loggedIn) => {
                    console.log(loggedIn,"value of logged in")
                    
                    let response = {};
                    if (loggedIn) {
                        console.log(" admin login success");
                        response.admin = data;
                        response.status = true;
                        resolve(response);
                    } else {
                        console.log("incorrect admin password");
                        resolve({ status: false });
                    }
                });
            } else {
                console.log("not admin");
                resolve({ status: false });
            }
        });
    },
    getOrderList : ()=>{
        return new Promise(async(resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
                resolve(orders)
              }) 
        },

        getCancelorder:(orderid)=>{
            return new Promise(async(resolve,reject)=>{
             db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderid)},
             {
                $set:{
                    status : 'cancelled'
                }
             }).then((response)=>{
                console.log("response after updating ordr",response);
                resolve(response)
             })
            })
        },
        
        getApproveOrder :(orderid)=>{
            return new Promise(async(resolve,reject)=>{
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderid)},
                {
                   $set:{
                       status : 'shipped'
                   }
                }).then((response)=>{
                   console.log("response after updating ordr",response);
                   resolve(response)
                })
               })

        },
        getOrderdeliverd:(orderid)=>{
            return new Promise(async(resolve,reject)=>{
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderid)},
                {
                   $set:{
                       status : 'deliverd'
                   }
                }).then((response)=>{
                   console.log("response after updating ordr",response);
                   resolve(response)
                })
               })
        },
        addCoupon :(couponData)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.COUPON_COLLECTION).insertOne(couponData).then((response)=>{
                    console.log("responesn after adding coupon",response);
                    console.log("data.insertid",response.insertedId);
                    resolve(response)
                })
            })
        },

        getCouponlist : ()=>{
            return new Promise(async(resolve, reject) => {
                let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
                console.log("listing coupons",coupons);
                    resolve(coupons)
                  }) 
        },

        getchartCount: ()=>{
            return new Promise(async(resolve, reject) => {
                let response={}
                response.cod = await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"cod"}).count()
                console.log("cout of cod",response.cod);
               response.on = await db.get().collection(collection.ORDER_COLLECTION).find({paymentMethod:"on"}).count()
                console.log("cout of on",response.on);
                resolve(response)
            })  
        }
    
}