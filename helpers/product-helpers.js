
var db=require('../config/connection')
var collection = require('../config/collections')
const { response } = require('../app')
const collections = require('../config/collections')
var objectId=require('mongodb').ObjectID  // id is stored in object format in database

module.exports={
    addProduct:(product,callback)=>{ //to insert product
        product.Price = parseInt(product.Price)
        db.get().collection('product').insertOne(product).then((data)=>{
            callback(data.ops[0]._id) //get id from db back to site
            //Normal callback 
        })
    },
        getAllProducts:()=>{ //view product using promise
            return new Promise(async(resolve , reject)=>{                                                           // Since await function should be async
                        let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()    // Await is used sice data is taken from database  
                        
                        resolve(products)
                    })
    },
    deleteProduct:(prodid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(prodid)}).then((response)=>{
                resolve(response)
            })
        })
         
    

},

getProductDeatails:(proid)=>{
     return new Promise((resolve, reject) => {
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proid)}).then((product)=>{
            resolve(product)
        })
    })
    
},

updateProducts:(pid,proDetails)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(pid)},{
            $set:{
                Name:proDetails.Name,
                Description : proDetails.Description,
                Price : proDetails.Price
            }
        }).then((response)=>{
            resolve()
        })

    
    })
},


//login admin

doLoginadmin:(details)=>{
    console.log("adcompar success999")
    status = true;
    let response = {};
    return new Promise(async (resolve, reject) => {
      let admin = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ Username: details.Username});
        console.log(admin)
      if (admin) {

        if(admin.Password ==details.Password)
           {
               console.log("adcompar success")
               response.nosuch=true
               response.admin=admin
               response.status=true
               resolve(response)
           }
              
        else

{       
    console.log("adcompar success2")
        response.status=true
        response.nosuch=false
        resolve(response) 
}          
        }
       else {
        console.log("adcompar success4")
        resolve({ status: false });
      }
    });

},


// to get all user 

getUsers:()=>{
    return new Promise(async(resolve,reject)=>{
        let users = await db.get().collection(collections.USER_COLLECTION).find().toArray()
        resolve(users)
    })

}

}