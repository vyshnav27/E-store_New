var express = require('express');
const { route, response } = require('../app');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')



const verifyadlogin = (req, res, next) => {
  if (req.session.admin) 
  next();
  else 
  res.redirect("admin/adminLogin");
}; //middleware




/* GET admin login. */

router.get('/',verifyadlogin,function(req,res,next) {
  console.log(req.session.admin)
  productHelper.getAllProducts().then((product)=>{            //THEN since await is used
    res.render('admin/view-product',{admin:true,product,admins:req.session.admin});
  })
})


  router.get('/adminLogin', function(req, res, next) {
      res.render('admin/login',{admin:true,admins:req.session.admin})
    })
  
  router.post("/login", (req, res) => {
    productHelpers.doLoginadmin(req.body).then((response) => {
      if (response.status && response.nosuch) {
        req.session.admin = true;
        req.session.admin = response.admin;
        res.redirect('/admin')
      } else if(response.status && response.nosuch==false) {
        console.log("invpass")
        res.render("admin/login",{msg:"*Invalid Password",admin:true})
        console.log("invpassssss")
      }
      else{
        res.render("admin/login",{msg:"*No admin Account found ",admin:true});
      }
    });
  });
 

router.get('/add-product',verifyadlogin, function(req,res){      //to get add product page when add btn is apressed in admin
   res.render('admin/add-product',{admin:true,admins:req.session.admin})
});

router.post('/add-product',(req,res)=>{
  console.log(req.body)
  productHelpers.addProduct(req.body,(id)=>{
    let image = req.files.image
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
    if(err)
       console.log("Addition of products Failed")
       else
       res.render("admin/add-product",{admin:true,admins:req.session.admin})  
     
    })
   
  })
})


router.get('/view-users',verifyadlogin,(req,res)=>{
  productHelpers.getUsers().then((users)=>{
    res.render('admin/view-users',{users,admin:true})
  })
})





router.get('/edit-product/:id',verifyadlogin,async(req,res)=>{
  let product = await productHelpers.getProductDeatails(req.params.id) 
  res.render('admin/edit-product', {product,admin:true,admins:req.session.admin})
  
  
})

router.post('/edit-product/:id',(req,res)=>{
  let id=req.params.id
  productHelpers.updateProducts(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.image){
      let image = req.files.image
      image.mv('./public/product-images/'+id+'.jpg')
    }

  })
})

module.exports = router;
