let cart = [];
let total = 0;


function addToCart(name, price){

cart.push({
name:name,
price:price
});

total += price;

displayCart();

document.getElementById("cartBox").style.display="block";

}



function displayCart(){

let items=document.getElementById("cartItems");

items.innerHTML="";


cart.forEach(function(product){

items.innerHTML += 
`
<p>
${product.name} - $${product.price}
</p>
`;

});


document.getElementById("cartTotal").innerHTML =
total.toFixed(2);

}



function closeCart(){

document.getElementById("cartBox").style.display="none";

}
