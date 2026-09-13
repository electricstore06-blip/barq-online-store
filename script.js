import { db } from "./firebase-config.js";

import {
collection,
getDocs
}
from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


let cart=[];



// ===============================
// LOAD PRODUCTS FROM FIREBASE
// ===============================

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


console.log("Products:",products);


displayProducts(products);


}

catch(error){

console.log("Firebase Error:",error);

}

}




// ===============================
// DISPLAY PRODUCTS
// ===============================

function displayProducts(products){

let container=document.querySelector(".product-container");


if(!container){

console.log("Products container missing");

return;

}


container.innerHTML="";


products.forEach(product=>{


let card=document.createElement("div");


card.className="product";


card.innerHTML=`

<img 
src="${product.image || 'barq-new.png'}"
alt="${product.name || 'BARQ Product'}"
>


<h3>
${product.name || "BARQ Product"}
</h3>


<p class="brand">
${product.brand || "BARQ"}
</p>


<div class="stars">

⭐⭐⭐⭐⭐ <span>(4.8)</span>

</div>


<p class="price">
${product.price || 0} ريال
</p>


<div class="product-actions">

<button class="view-btn">

View Details

</button>


<button class="add-btn">

Add To Cart

</button>


<button class="heart-btn">

❤️

</button>

</div>

`;



card.querySelector(".add-btn").onclick=function(){


addToCart(

product.name || "BARQ Product",

product.price || 0

);


};



container.appendChild(card);



});


}




// ===============================
// CART FUNCTIONS
// ===============================


function addToCart(name,price){


let existing = cart.find(item => item.name === name);


if(existing){

existing.quantity++;

}
else{

cart.push({

name:name,

price:Number(price),

quantity:1

});

}


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


items.innerHTML += `

<div class="cart-item">


<b>${item.name}</b>

<br>

${item.price} ريال

<br>


<button onclick="decreaseQty(${index})">
-
</button>


<span>
${item.quantity}
</span>


<button onclick="increaseQty(${index})">
+
</button>


<button onclick="removeCart(${index})">
X
</button>


</div>

`;


sum += item.price * item.quantity;


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





// MAKE BUTTONS WORK


window.addToCart=addToCart;

window.openCart=openCart;

window.closeCart=closeCart;

window.removeCart=removeCart;

window.checkout=checkout;



// START STORE

loadProducts();
