var express = require("express");
const { response } = require("../app");
const { deleteProduct } = require("../helpers/product-helpers");
var router = express.Router();
var productHelper = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");




const verifylogin = (req, res, next) => {
  //to check if user is logged in
  if (req.session.user) next();
  else res.redirect("/login");
}; //middleware






/* GET home page. */

router.get("/",async function (req, res, next) {
  let user = req.session.user; //checking if user is already logged in
  let cartCount=null
  if(req.session.user)
  cartCount = await userHelpers.getCartCount(req.session.user._id)
  productHelper.getAllProducts().then((products) => {
    //THEN since await is used
    console.log(cartCount)
    res.render("user/view-products", { admin: false, products, user ,cartCount});
  });
});

router.get("/login", (req, res) => {
  if (req.session.user)
    // if already logged in no need for login page
    res.redirect("/");
  else {
    res.render("user/login", { lerr: req.session.userLoginErr });
    req.session.userLoginErr = false;
  }
});

router.get("/signup", (req, res) => {
  res.render("user/signup");
});

router.post("/signup", (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
      req.session.loggedIN=true
      req.session.user=response
      res.redirect('/')

  });
});

router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      req.session.userLoginErr = "Invalid username or password";
      res.redirect("/login");
    }
  });
});

router.get('/logOut', (req, res) => {

    req.session.user=null
    res.redirect("/");
  
});


router.get('/adminOut',(req,res)=>{
  req.session.admin=null
  res.redirect("/admin")
})

router.get('/delete/:id',(req,res)=>{
  let pid=req.params.id
  productHelper.deleteProduct(pid).then((response)=>{
    res.redirect('/admin')
  
  })

})

router.get('/cart',verifylogin,async(req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  if(products.length > 0)   
      {
        total = await userHelpers.getTotalAmount(req.session.user._id)
        res.render('user/cart',{products,user:req.session.user,total});
      }
  else{
    total1=1
    res.render('user/cart',{products,user:req.session.user,total1});
  }    
});



router.get('/add-to-cart/:id',(req,res)=>{

  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  

  })  
  
})

// ===================== ajax product quantity cart page ==================//
router.post('/product-quantity',async(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
  if(!response.removeProduct)
       {
         response.total = await userHelpers.getTotalAmount(req.session.user._id)
         res.json(response)
        }
  else
      res.json(response)
    
   
  })
})


router.post("/delete-product",async(req,res)=>{  //deleting products
  console.log("Action for delete initiated",req.body)
  await userHelpers.deleteProduct(req.body).then((response)=>{
    res.json(response)
  })
})


router.get('/place-order',verifylogin,async(req,res)=>{
    let total = await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/place-order',{total,user:req.session.user})

})





router.post('/place-order',async(req,res)=>{
  let products = await userHelpers.getCartList(req.body.userId)
  let total = await userHelpers.getTotalAmount(req.body.userId)
  console.log(total);
  console.log(products)
  userHelpers.placeOrder(req.body,products,total).then((orderId)=>{// order id is returned for online payment
    if(req.body.Payment==='COD'){
      console.log("cod done")
      res.json({codsuccess:true})
   }
   else
  console.log("ONline inititated")
  userHelpers.generateRazorpay(orderId,total).then((response)=>{ 
  res.json(response)  
  })
  })
})


router.get('/order-success',(req,res)=>{  //succes page
  res.render('user/order-success',{user:req.session.user})
})

router.get('/order',verifylogin,async(req,res)=>{   //get orders of the user
  let orders = await userHelpers.gertUserOrders(req.session.user._id)
  res.render('user/order',{user:req.session.user,orders})
})


router.get('/view-order-products/:id',async(req,res)=>{
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products})
})



//to verify payment after razorpay

router.post('/verify-payment',(req,res)=>{ // to compare hash to know whether pay is success
  console.log("post verify") 
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("hey")
      res.json({status:true})
    })

   }).catch((err)=>{ //reject from promise
    console.log("pay failed mahn")
      res.json({status:false,errMsg:''})
   }) 
})


module.exports = router;
