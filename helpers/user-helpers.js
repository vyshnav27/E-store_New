var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("../app");
const collections = require("../config/collections");
var objectId = require("mongodb").ObjectID; // id is stored in object format in database
const Razorpay = require('razorpay');
const { HmacSHA256 } = require("crypto-js");

var instance = new Razorpay({     //razorpay object creation
  key_id: 'rzp_test_tgmWleTS9p8Jqh',
  key_secret: 'x3RPyirL5aBXO0aB88RZmC5e',
});






module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10); //encrypting password
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },

  doLogin: (userData) => {
    status = false;
    let response = {};
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
          } else resolve({ status: false });
        });
      } else {
        resolve({ status: false });
      }
    });
  },

  addToCart: (proId, orderId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(orderId) });
      if (userCart) {
        let product_exist = userCart.products.findIndex(
          (product) => product.item == proId
        ); //kind of iteration to find if productid is already in cart
        if (product_exist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(orderId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 }, //$ because quantiy is element inside an array in mogo
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(orderId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(orderId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then(() => {
            resolve();
          });
      }
    });
  },


  getCartProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      //aggregate since multiple queries needed
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(orderId) },
          },
          {
            $unwind: "$products", // each product has sepaerate object id's
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },


  getCartCount: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(orderId) });
      if (cart) {
        count = cart.products.length;
      }
      console.log(count)
      resolve(count);
    });
  },


  changeProductQuantity:(details) => {

    /* req body containing cart id product id and count pass ed to here from ajax called fro qty updation
     which can be recievd from here using above paramters as seperate args */
    details.count = parseInt(details.count)
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      console.log(details.count,details.quantity)
      if (details.count == -1 && details.quantity == 1) {
        //pressed value -ve and quantity is currentl 1 , product in cart with qty 1
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct:true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id:objectId(details.cart),"products.item": objectId(details.product) },
            {
              $inc:{"products.$.quantity":details.count }, //$ because quantiy is element inside an array in mogo
            }
          )
          .then((response) => {
            resolve({status:true});
          });
      }
    });
  },
  

deleteProduct:(details)=>{
  return new Promise((resolve, reject) => {
    console.log("DElboy")
    db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
  }) 
},


getTotalAmount:(orderId)=>{
  
  return new Promise(async(resolve, reject) => {
    //aggregate since multiple queries needed
    let total = await db
      .get()
      .collection(collection.CART_COLLECTION)
      .aggregate([
        {
          $match: { user:objectId(orderId) },
        },
        {
          $unwind: "$products", // each product has sepaerate object id's
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "item",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt:["$product", 0] },
          },
        },
        {
          $group:{ //group is used instead of project coz all projects group wise overall cost is taken
            _id:null, //since group 
            total:{$sum:{$multiply:['$quantity','$product.Price']}}
          }
        }
      ])
      .toArray();
      console.log(total[0].total)
    resolve(total[0].total)
  });

},

placeOrder:(order,product,total)=>{
  var nowDate = new Date(); 
  var date = nowDate.getDate()+'/'+(nowDate.getMonth()+1)+'/'+nowDate.getFullYear(); 
  return new Promise(async(resolve,reject)=>{
    let order_status = order['Payment']==='COD'?'placed':'pending' //methode is cod then order is places lese then pending 
    let orderObj={      // order object
      deliveryDetails:{
        Phone:order.Phone,
        Address:order.Address,
        City:order.City,
        Pincode:order.Pincode
      },
      userId:objectId(order.userId),
      orderId:objectId(order.orderId),
      paymentMethod:order.Payment,
      products:product,
      totalAmount:total,
      status:order_status,
      date: date
    }
    db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
    db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userId)})
    resolve(response.ops[0]._id) //to get order id
     })
    
  })
},


getCartList:(orderId)=>{
  return new Promise(async(resolve,reject)=>{
    let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(orderId)})
      resolve(cart.products) //to products from cart
    
})
},




gertUserOrders:(userId)=>{     //to get orders of a user

return new Promise(async(resolve,reject)=>{
  let orders = await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
  resolve(orders)
})

},



//================================ getOrderProducts ================//

getOrderProducts:(orderId)=>{
  console.log(orderId)
  return new Promise(async(resolve, reject) => {
    //aggregate since multiple queries needed
    let orderItems = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate([
        {
          $match: { _id:objectId(orderId) },
        },
        {
          $unwind: "$products", // each product has sepaerate object id's
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "item",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt:["$product", 0] },
          },
        }
        
      ])
      .toArray();
      console.log(orderItems)
    resolve(orderItems)
  });

},



 // online payment 

 generateRazorpay:(orderId,totalPrice)=>{
   return new Promise((resolve,reject)=>{
          
    var options = { 
    amount: totalPrice*100,  // amount in the smallest currency unit 
    currency: "INR",  
    receipt: ""+orderId
  };
    instance.orders.create(options, function(err, order)
     { 
      if(err)
      {
        console.log("razorpayeerro")
        console.log(err)
      } 
      else{
        
        resolve(order)
      }
    });
     
   })
 },

 verifyPayment: (details) => {
  console.log(details);
  return new Promise((resolve, reject) => {
    const crypto = require("crypto");
    console.log("pay inside");
    hmac = crypto.createHmac("sha256", "x3RPyirL5aBXO0aB88RZmC5e");
    hmac.update(
      details["payment[razorpay_order_id]"] +
        "|" +
        details["payment[razorpay_payment_id]"]
    ); //razorpay order id payment key altogether hashed
    hmac = hmac.digest("hex"); // hexa code comparison..
    if (hmac == details["payment[razorpay_signature]"]) {
      console.log("razor hash success");
      resolve();
    } else {
      console.log("Reject");
      reject();
    }
  });
},

changePaymentStatus:(orderId)=>{  //to change status in order
return new Promise((resolve, reject) => {
  var res={}
  db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
  {
    $set:{status:'placed'}
  }).then(()=>{
    res.status=true
    console.log(res.status)
    console.log("status up")
    resolve()
  })


})


}

};

