import { db } from "./firebase-config.js";

import {
collection,
getDocs
}
from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



let cart=[];



// LOAD FIREBASE PRODUCTS

async function loadProducts(){

try{


const snapshot = await getDocs(collection(db,"products"));


let products=[];


snapshot.forEach((doc)=>{

products.push({

id:doc.id,

...doc.data()

});


});


console.log(products);


displayProducts(products);



}

catch(error){

console.log(error);

}


}




// DISPLAY PRODUCTS


function displayProducts(products){


let container=document.getElementById("products");



if(!container){

return;

}



products.forEach(product=>{


let card=document.createElement("div");


card.className="product";



card.innerHTML=`

<img src="${product.image}">


<h3>${product.name}</h3>


<p class="brand">

${product.brand}

</p>


<p class="price">

${product.price} ريال

</p>


<button>

Add To Cart

</button>


`;



card.querySelector("button")
.onclick=function(){


addToCart(
product.name,
product.price
);


};



container.appendChild(card);



});



}




// CART


function addToCart(name,price){


cart.push({

name:name,

price:Number(price)

});



document.getElementById("cartCount").innerHTML=cart.length;


updateCart();


}



function openCart(){


document.getElementById("cartBox").style.display="block";


updateCart();


}




function closeCart(){


document.getElementById("cartBox").style.display="none";


}





function updateCart(){



let items=document.getElementById("cartItems");

let total=document.getElementById("cartTotal");



items.innerHTML="";


let sum=0;



cart.forEach((item,index)=>{


items.innerHTML+=`

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




function removeCart(index){


cart.splice(index,1);


document.getElementById("cartCount").innerHTML=cart.length;


updateCart();


}




function checkout(){


alert("Thank you for shopping with BARQ");


}




window.addToCart=addToCart;

window.openCart=openCart;

window.closeCart=closeCart;

window.removeCart=removeCart;

window.checkout=checkout;



loadProducts();
