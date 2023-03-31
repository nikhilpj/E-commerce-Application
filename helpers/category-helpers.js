var db = require('../config/connection')
var collection = require('../config/collection')
const { response } = require('express')
const { ObjectId } = require('mongodb')
var objectId = require('mongodb').ObjectID
module.exports ={
    
    addCategory : (category)=>{
        return new Promise((resolve,reject)=>{
            console.log("this is data in req.body of category field",category)
            let status = db.get().collection(collection.CATEGORY_MANAGEMENT).findOne({category:category})
            if(status)
            {
                console.log("category exists already");
                resolve()
            }
            else
            {
                db.get().collection('category').insertOne(category).then((data)=>{
            
                    resolve(data.insertedId)
            })
            }
        
       
        })
    },

    getAllCategory : ()=>{
        return new Promise(async(resolve,reject)=>{
            let categories = await db.get().collection(collection.CATEGORY_MANAGEMENT).find().toArray()
            resolve(categories)
        })
    },
    deleteCategory : (categoryId)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_MANAGEMENT).deleteOne({_id:objectId(categoryId)}).then((response)=>{
                resolve(response)
            })
        })
    },

  

    getcategoryDetails:(categoryId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_MANAGEMENT).findOne({_id: ObjectId(categoryId)}).then((category)=>{
                resolve(category)
            })
    
        })
       },

       updateCategory:(categoryId,categoryDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_MANAGEMENT).updateOne({_id:objectId(categoryId)},{
             $set:{
                
                category: categoryDetails.category,
               
    
             }   
            }).then((response)=>{
                resolve()
            })
        })
    }
}