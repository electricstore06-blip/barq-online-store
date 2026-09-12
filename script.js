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

