
function addToCart(proid) //function to implement ajax
{
    $.ajax({
        url:'/add-to-cart/'+proid,
        method:'get',
        success:(response)=>{
            if(response.status){
              let count = $('#cart-count').html()
              count=parseInt(count)+1
               $('#cart-count').html(count)
            }
        }
        
    })
}

function changeQuantity(cartId,proId,userId,count)
    {       
        let quantity = parseInt(document.getElementById(proId).innerHTML)
        count=parseInt(count)
        $.ajax({   
        url:'/product-quantity',
        data:{
            cart:cartId,
            user:userId,
            product:proId,
            count:count,
            quantity:quantity
        },
        method:'post',
        success:(response)=>{
            if(response.removeProduct)
            {
                alert("Product Removed Successfully")
                location.reload()
            }
            else{
                document.getElementById(proId).innerHTML=quantity+count
                document.getElementById('total').innerHTML=response.total
            }
        }
    })
    }
    
    function deleteProduct(cartId,proId)
    {      
        $.ajax({   
        url:"/delete-product",
        data:{
            cart:cartId,
            product:proId,
        },
        method:'post',
        success:(response)=>{
            if(response.removeProduct)
            {
                alert("Product Removed Successfully")
                location.reload()
            }
            else{
                console.log("notDeleted")
            }
        }
    })
    }








    
// Ajax 