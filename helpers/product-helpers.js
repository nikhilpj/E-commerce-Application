var db = require("../config/connection");
var fs = require("fs");
var collection = require("../config/collection");
const { response } = require("express");
const { ObjectId } = require("mongodb");
var objectId = require("mongodb").ObjectID;
module.exports = {
  addProduct: (product, callback) => {
    product.stock = parseInt(product.stock);
    db.get()
      .collection("product")
      .insertOne(product)
      .then((data) => {
        callback(data.insertedId);
      });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: objectId(prodId) })
        .then((response) => {
          fs.unlinkSync("./public/product-images/" + prodId + ".jpg");
          fs.unlinkSync("./public/product-images/" + prodId +1+ ".jpg");
          fs.unlinkSync("./public/product-images/" + prodId +2+ ".jpg");
          resolve(response);
        });
    });
  }, 

  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(proId) })
        .then((product) => {
          resolve(product);
        });
    });
  },

  updateProduct: (proId, proDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              name: proDetails.name,
              category: proDetails.category,
              price: proDetails.price,
              description: proDetails.description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  searchproducts: (input) => {
    return new Promise(async (resolve, reject) => {
      try {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .createIndex({ name: "text" });
        let products = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .find({ $text: { $search: input } })
          .toArray();
        resolve(products);
      } catch (e) {
        console.log("error is", e);
      }
    });
  },
};
