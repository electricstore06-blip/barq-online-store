import { db } from "./firebase-config.js";

import {
collection,
getDocs
}
from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// CART

let cart=[];



// LOAD PRODUCTS

async function loadProducts(){

try{


const snapshot = await getDocs(
collection(db,"products")
);


let products=[];


snapshot.forEach((doc)=>{


products.push({

id:doc.id,

...doc.data()

});


});


console.log(products);


displayProducts(products);



}catch(error){

console.log("Firebase Error:",error);

}


}



loadProducts();




// DISPLAY PRODUCTS FROM FIREBASE

function displayProducts(products){


let container = document.querySelector(".product-container");


if(!container){

console.log("Product container missing");

return;

}



products.forEach(product=>{


container.innerHTML += `


<div class="product">


<img src="${product.image}">



<h3>

${product.name}

</h3>



<p class="brand">

${product.brand}

</p>



<p class="price">

${product.price} ريال

</p>



<button onclick="addToCart('${product.name}',${product.price})">

Add To Cart

</button>



</div>


`;


});


}



container.innerHTML="";



products.forEach(product=>{


container.innerHTML += `


<div class="product">


<img src="${product.image}">


<h3>${product.name}</h3>


<p>${product.brand}</p>


<p class="price">

${product.price} ريال

</p>



<button onclick="addToCart('${product.name}',${product.price})">

Add To Cart

</button>


</div>


`;


});


}






// ADD CART


function addToCart(name,price){


cart.push({

name:name,

price:Number(price)

});



document.getElementById("cartCount").innerHTML=cart.length;



updateCart();


}





// OPEN CART


function openCart(){

document.getElementById("cartBox").style.display="block";


updateCart();


}




// CLOSE CART


function closeCart(){

document.getElementById("cartBox").style.display="none";

}






// UPDATE CART


function updateCart(){


let items=document.getElementById("cartItems");

let total=document.getElementById("cartTotal");



if(!items || !total){

return;

}



items.innerHTML="";


let sum=0;



cart.forEach((item,index)=>{


items.innerHTML += `


<p>

${item.name}

<br>

${item.price} ريال


<button onclick="removeCart(${index})">

X

</button>


</p>


<hr>


`;



sum += item.price;


});



total.innerHTML=sum;



}







// REMOVE


function removeCart(index){


cart.splice(index,1);



document.getElementById("cartCount").innerHTML=cart.length;


updateCart();


}





// CHECKOUT


function checkout(){


alert(
"Thank you for shopping with BARQ!"
);


}






// MAKE GLOBAL


window.addToCart=addToCart;

window.openCart=openCart;

window.closeCart=closeCart;

window.checkout=checkout;

window.removeCart=removeCart;
