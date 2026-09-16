// ==============================
// BARQ CHECKOUT JAVASCRIPT
// ==============================


document.addEventListener("DOMContentLoaded", function(){


const orderButton = document.querySelector(".checkout-box button");


orderButton.addEventListener("click", function(){


const name =
document.getElementById("full-name").value.trim();


const phone =
document.getElementById("phone").value.trim();


const email =
document.getElementById("email").value.trim();


const address =
document.getElementById("address").value.trim();


const payment =
document.querySelector(
'input[name="payment"]:checked'
);



if(name === ""){

alert("Please enter your full name");
return;

}


if(phone === ""){

alert("Please enter your phone number");
return;

}


if(email === ""){

alert("Please enter your email");
return;

}


if(address === ""){

alert("Please enter delivery address");
return;

}


if(!payment){

alert("Please select payment method");
return;

}



const orderData = {


customerName:name,

phone:phone,

email:email,

address:address,

paymentMethod:payment.value,

date:new Date().toLocaleString()


};



console.log(orderData);



alert(
"Thank you " + name +
"\nYour order has been received!"
);



});


});
