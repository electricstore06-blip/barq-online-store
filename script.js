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

const container = document.querySelector(".product-container");

console.log("DISPLAY PRODUCTS:", products);


if(!container){

console.error("NO PRODUCT CONTAINER");

return;

}


container.innerHTML = "";


products.forEach((product)=>{


const card = document.createElement("div");

card.className = "product";


card.innerHTML = `


<div class="product-click">


<img
class="product-img"
src="${product.image}"
alt="${product.name}">


<h3>
${product.name}
</h3>


<p class="brand">
${product.brand || "BARQ"}
</p>


<p class="price">
${Number(product.price).toFixed(2)} SAR
</p>


</div>



<button class="add-btn">
Add To Cart
</button>


`;




// CLICK PRODUCT IMAGE / NAME

const productArea =
card.querySelector(".product-click");


if(productArea){

productArea.onclick = ()=>{


console.log(
"PRODUCT CLICKED:",
product.id
);


window.location.href =
"./product-details.html?id=" + product.id;


};

}





// ADD TO CART

const addButton =
card.querySelector(".add-btn");


if(addButton){

addButton.onclick = (event)=>{


event.stopPropagation();



addToCart(

product.id,

product.name,

product.price,

product.image,

product.brand

);


};

}



container.appendChild(card);



});


console.log("PRODUCT CARDS CREATED");

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
window.addToCart = addToCart;
window.toggleMenu = toggleMenu;
window.openCart = openCart;
window.closeCart = closeCart;
window.checkout = checkout;
window.removeCart = removeCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;

const menuButton =
document.getElementById("menuButton");


if(menuButton){

menuButton.addEventListener(
"click",
toggleMenu
);

}


// ==========================================
// START
// ==========================================


loadProducts();


updateCart();
