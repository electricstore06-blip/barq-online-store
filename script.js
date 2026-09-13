import { db } from "./firebase-config.js";


import {
collection,
getDocs
}

from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



let cart = JSON.parse(localStorage.getItem("barqCart")) || [];




// ===============================
// LOAD PRODUCTS
// ===============================


async function loadProducts(){


try{


let container=document.querySelector(".product-container");


if(container){

container.innerHTML="<p>Loading products...</p>";

}



const snapshot = await getDocs(collection(db,"products"));


let products=[];



snapshot.forEach((doc)=>{


products.push({

id:doc.id,

...doc.data()

});


});



console.log("BARQ Products:",products);



displayProducts(products);



}


catch(error){


console.log("Firebase Error:",error);



let container=document.querySelector(".product-container");


if(container){

container.innerHTML=
"<p>Unable to load products</p>";

}


}



}




// ===============================
// DISPLAY PRODUCTS
// ===============================


function displayProducts(products){



let container=document.querySelector(".product-container");



if(!container){

return;

}



container.innerHTML="";




products.forEach(product=>{


let card=document.createElement("div");


card.className="product";



card.innerHTML=`


<img 
class="product-img"
src="${product.image || "barq-new.png"}"
alt="${product.name || "BARQ Product"}"
>



<h3>
${product.name || "BARQ Product"}
</h3>



<p class="brand">

${product.brand || "BARQ"}

</p>



<div class="stars">

⭐⭐⭐⭐⭐

<span>(4.8)</span>

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





card.querySelector(".add-btn")
.onclick=()=>{


addToCart(

product.name || "BARQ Product",

product.price || 0

);


};




container.appendChild(card);



});



}






// ===============================
// CART
// ===============================



function saveCart(){


localStorage.setItem(

"barqCart",

JSON.stringify(cart)

);


}





function addToCart(name,price){



let item=cart.find(

p=>p.name===name

);



if(item){


item.quantity++;

}

else{


cart.push({

name:name,

price:Number(price),

quantity:1

});


}



saveCart();



updateCart();



}





function openCart(){


document.getElementById("cartBox")
.style.display="block";


updateCart();


}





function closeCart(){


document.getElementById("cartBox")
.style.display="none";


}





function updateCart(){



let items=document.getElementById("cartItems");

let total=document.getElementById("cartTotal");

let count=document.getElementById("cartCount");



if(!items){

return;

}



items.innerHTML="";



let sum=0;

let quantity=0;



cart.forEach((item,index)=>{


quantity += item.quantity;



items.innerHTML += `



<div class="cart-item">


<b>
${item.name}
</b>


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

Remove

</button>



</div>


`;



sum += item.price * item.quantity;



});





if(total){

total.innerHTML=sum;

}



if(count){

count.innerHTML=quantity;

}



saveCart();



}







function increaseQty(index){



cart[index].quantity++;



updateCart();



}






function decreaseQty(index){



if(cart[index].quantity>1){


cart[index].quantity--;


}

else{


cart.splice(index,1);


}



updateCart();



}





function removeCart(index){



cart.splice(index,1);



updateCart();



}





function checkout(){


window.location.href="checkout.html";


}





// ===============================
// MAKE BUTTONS GLOBAL
// ===============================


window.openCart=openCart;

window.closeCart=closeCart;

window.addToCart=addToCart;

window.increaseQty=increaseQty;

window.decreaseQty=decreaseQty;

window.removeCart=removeCart;

window.checkout=checkout;



// START STORE


loadProducts();


updateCart();
