// Firebase Firestore products
import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


async function loadProducts(){

const querySnapshot = await getDocs(collection(db,"products"));

let products=[];

querySnapshot.forEach((doc)=>{

products.push({
id: doc.id,
...doc.data()
});

});

console.log(products);

displayProducts(products);
}

loadProducts();
let cart = [];



// ADD TO CART

function addToCart(name, price){

    cart.push({
        name:name,
        price:price
    });


    document.getElementById("cartCount").innerHTML = cart.length;


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

let items = document.getElementById("cartItems");

let total = document.getElementById("cartTotal");


items.innerHTML="";


let sum = 0;


cart.forEach(function(product,index){


items.innerHTML += `

<p>
${product.name}
<br>
${product.price} ريال

<button onclick="removeCart(${index})">
X
</button>

</p>

<hr>

`;


sum += product.price;


});


total.innerHTML=sum;


}




// REMOVE ITEM

function removeCart(index){

cart.splice(index,1);

document.getElementById("cartCount").innerHTML=cart.length;

updateCart();

}




// CHECKOUT

function checkout(){

alert("Thank you for shopping with BARQ!");

}




// MAKE FUNCTIONS AVAILABLE

window.addToCart=addToCart;

window.openCart=openCart;

window.closeCart=closeCart;

window.checkout=checkout;

function displayProducts(products){

let container = document.getElementById("products");

if(!container){
console.log("Products container not found");
return;
}

container.innerHTML="";

products.forEach(product=>{

container.innerHTML += `

<div class="product-card">

<img src="${product.image}" width="200">

<h3>${product.name}</h3>

<p>${product.brand}</p>

<p>${product.price} SAR</p>

<button onclick='addToCart(${JSON.stringify(product)})'>
Add To Cart
</button>

</div>

`;

});

}
