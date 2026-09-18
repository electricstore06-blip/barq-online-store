// ==========================================
// BARQ STORE MAIN SCRIPT
// ==========================================


import { db } from "./firebase-config.js";


import {
    collection,
    getDocs
} 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// ==========================================
// VARIABLES
// ==========================================


let productsData = [];


let cart =
JSON.parse(localStorage.getItem("barqCart")) || [];





// ==========================================
// LOAD PRODUCTS FROM FIREBASE
// ==========================================


async function loadProducts(){
console.log("LOAD PRODUCTS STARTED");

const container =
document.querySelector(".product-container");



if(!container) return;



container.innerHTML =
"<p>Loading products...</p>";



try{


const snapshot =
await getDocs(
collection(db,"products")
);
console.log("PRODUCT COUNT:", snapshot.size);


productsData = [];


snapshot.forEach((doc)=>{

console.log("PRODUCT DATA:", doc.id, doc.data());

productsData.push({

id:doc.id,

...doc.data()

});

});



displayProducts(productsData);



}


catch(error){


console.error(
"Firebase Products Error:",
error
);



container.innerHTML =
"<p>Unable to load products</p>";


}



}







// ==========================================
// DISPLAY PRODUCTS
// ==========================================


function displayProducts(products){


const container =
document.querySelector(".product-container");



if(!container) return;



container.innerHTML = "";



if(products.length===0){


container.innerHTML =
"<p>No products found</p>";


return;


}




products.forEach((product)=>{


const card =
document.createElement("div");



card.className =
"product";



const image =
product.image ||
"https://images.unsplash.com/photo-1596462502278-27bfdc403348";



const name =
product.name ||
"Beauty Product";



const brand =
product.brand ||
"BARQ";



const price =
Number(product.price || 0);



card.innerHTML = `


<a 
class="product-link"
href="product-details.html?id=${product.id}"
>


<img
class="product-img"
src="${image}"
alt="${name}"
>


<h3>
${name}
</h3>


<p class="brand">
${brand}
</p>


<p class="price">
${price.toFixed(2)} SAR
</p>


</a>



<button 
class="add-btn">

Add To Cart

</button>


`;





card
.querySelector(".add-btn")
.onclick = ()=>{


addToCart(

product.id,

name,

price,

image,

brand

);


};



container.appendChild(card);



});



}







// ==========================================
// SEARCH
// ==========================================


const searchInput =
document.getElementById("searchInput");



if(searchInput){


searchInput.addEventListener(
"input",
()=>{


const value =
searchInput.value
.toLowerCase();



const result =
productsData.filter(product=>{


return (

(product.name || "")
.toLowerCase()
.includes(value)


||


(product.brand || "")
.toLowerCase()
.includes(value)


||


(product.category || "")
.toLowerCase()
.includes(value)


);


});



displayProducts(result);



});


}









// ==========================================
// CART SYSTEM
// ==========================================



function saveCart(){


localStorage.setItem(

"barqCart",

JSON.stringify(cart)

);


}






function addToCart(
id,
name,
price,
image,
brand
){



const existing =
cart.find(
item =>
item.productId === id
);



if(existing){


existing.quantity++;


}

else{


cart.push({

productId:id,

name:name,

price:Number(price),

image:image,

brand:brand,

quantity:1

});


}



saveCart();


updateCart();



alert(
"Added to cart ✅"
);



}







function updateCart(){



const items =
document.getElementById("cartItems");


const total =
document.getElementById("cartTotal");


const count =
document.getElementById("cartCount");



let sum = 0;

let quantity = 0;




if(items){


items.innerHTML = "";



cart.forEach(
(item,index)=>{


sum +=
item.price *
item.quantity;


quantity +=
item.quantity;




items.innerHTML += `


<div class="cart-item">


<b>
${item.name}
</b>


<p>
${item.price} SAR
</p>


<button onclick="decreaseQuantity(${index})">

-

</button>


<span>

${item.quantity}

</span>


<button onclick="increaseQuantity(${index})">

+

</button>



<button onclick="removeCart(${index})">

Remove

</button>



</div>


`;



});



}



if(total){

total.innerText =
sum.toFixed(2);

}



if(count){

count.innerText =
quantity;

}



}









function increaseQuantity(index){


if(cart[index]){


cart[index].quantity++;


saveCart();

updateCart();


}


}







function decreaseQuantity(index){


if(cart[index]){


cart[index].quantity--;



if(cart[index].quantity<=0){


cart.splice(index,1);


}



saveCart();


updateCart();


}



}







function removeCart(index){


cart.splice(index,1);


saveCart();


updateCart();



}









// ==========================================
// CART OPEN CLOSE
// ==========================================



function openCart(){


const box =
document.getElementById("cartBox");



if(box){

box.style.display="block";

}



updateCart();



}






function closeCart(){


const box =
document.getElementById("cartBox");



if(box){

box.style.display="none";

}



}








function checkout(){


if(cart.length===0){


alert(
"Your cart is empty"
);


return;


}



window.location.href =
"checkout.html";



}








// ==========================================
// MOBILE MENU
// ==========================================


function toggleMenu(){


const menu =
document.getElementById("mainNav");



if(menu){

menu.classList.toggle("active");

}


}







document.addEventListener(
"DOMContentLoaded",
()=>{


const links =
document.querySelectorAll(
"#mainNav a"
);



links.forEach(link=>{


link.addEventListener(
"click",
()=>{


const menu =
document.getElementById("mainNav");



if(menu){

menu.classList.remove("active");

}


});


});



});









// ==========================================
// EXPORT TO HTML
// ==========================================


window.toggleMenu =
toggleMenu;


window.openCart =
openCart;


window.closeCart =
closeCart;


window.checkout =
checkout;


window.removeCart =
removeCart;


window.increaseQuantity =
increaseQuantity;


window.decreaseQuantity =
decreaseQuantity;






// ==========================================
// START
// ==========================================


loadProducts();


updateCart();
