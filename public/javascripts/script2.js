

    $("#check-out").submit((e)=>{
        e.preventDefault()
        $.ajax({

            url:'/place-order',
            method:'post',
            data:$('#check-out').serialize(),
            success:(response)=>{
                if(response.codsuccess)
                {
                    alert(response)
                    location.href='/order-success'
                }

                else{
                    alert(response)
                    razorpayPayment(response)
                }
            }

        })
    })

    function razorpayPayment(order) {

        var options = {
            "key": "rzp_test_tgmWleTS9p8Jqh", // Enter the Key ID generated from the Dashboard
            "amount": order.totalAmount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
            "currency": "INR",
            "name": "Vyshnav Online",
            "description": "Test Transaction",
            "image": "https://example.com/your_logo",
            "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
            "handler": function (response) {
               
                verifyPayment(response, order)
            },
            "prefill": {
                "name": "Your Name",
                "email": "yourname@example.com",
                "contact": "9999999999"
            },
            "notes": {
                "address": "Razorpay Corporate Office"
            },
            "theme": {
                "color": "#F37254"
            }
        };


            var rzp1 = new Razorpay(options);
            rzp1.open();

    }


    function verifyPayment(payment, order) {
        $.ajax({
            url: '/verify-payment',
            data: {
                payment,
                order
            },
            method:'post',
            success:(response)=>{
                if(response){
                    alert("Payment Success")
                    location.href='/order-success' 
                 }              
            else{
                alert("Payment Failed")
        }
            }
     
    })
    }