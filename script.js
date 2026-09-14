let cart = [];


function addToCart(name,price){

cart.push({
name:name,
price:price
});

updateCart();

alert(name + " added to cart");

}



function updateCart(){

let items=document.getElementById("cartItems");

let total=document.getElementById("cartTotal");


items.innerHTML="";

let sum=0;


cart.forEach((product,index)=>{


items.innerHTML +=

`
<p>
${product.name} 
$${product.price}

<button onclick="removeItem(${index})">
❌
</button>

</p>
`;

sum += product.price;


});


total.innerHTML=sum.toFixed(2);


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
