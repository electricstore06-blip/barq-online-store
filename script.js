let cart = [];


function addToCart(name, price){

let existing = cart.find(item => item.name === name);

if(existing){

existing.quantity++;

}else{

cart.push({
name:name,
price:price,
quantity:1
});

}

updateCart();

}



function updateCart(){

let items = document.getElementById("cartItems");
let totalBox = document.getElementById("cartTotal");
let countBox = document.getElementById("cartCount");


items.innerHTML="";

let total = 0;
let count = 0;


cart.forEach(function(item,index){


total += item.price * item.quantity;

count += item.quantity;


let product = document.createElement("div");


product.innerHTML = `
<div class="cart-product">

<div>
<strong>${item.name}</strong>
<br>
<span>$${item.price} x ${item.quantity}</span>
</div>

<div>
<button onclick="changeQuantity(${index},-1)">−</button>

<span>${item.quantity}</span>

<button onclick="changeQuantity(${index},1)">+</button>
</div>

<button onclick="removeItem(${index})">
❌
</button>

</div>
`;

items.appendChild(product);


});


totalBox.innerHTML = total.toFixed(2);

countBox.innerHTML = count;


}



function removeItem(index){

cart.splice(index,1);

updateCart();

}



function openCart(){

document.getElementById("cartBox").style.display="block";

}



function closeCart(){

document.getElementById("cartBox").style.display="none";

}



function checkout(){

if(cart.length===0){

alert("Your cart is empty");

}else{

alert("Thank you for shopping with BARQ!");

}

}
function changeQuantity(index,value){

cart[index].quantity += value;

if(cart[index].quantity <=0){
cart.splice(index,1);
}

updateCart();

}
