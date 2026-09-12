import { register, login, logout } from "./auth.js";

let cart = [];


/* CART */

window.addToCart = function(name, price){

    let item = cart.find(product => product.name === name);

    if(item){
        item.quantity++;
    }
    else{
        cart.push({
            name:name,
            price:price,
            quantity:1
        });
    }

    updateCart();
};


function updateCart(){

    let cartItems = document.getElementById("cartItems");
    let cartTotal = document.getElementById("cartTotal");
    let cartCount = document.getElementById("cartCount");

    if(!cartItems) return;

    cartItems.innerHTML = "";

    let total = 0;
    let count = 0;


    cart.forEach((item,index)=>{

        total += item.price * item.quantity;
        count += item.quantity;


        cartItems.innerHTML += `

        <div class="cart-product">

        <strong>${item.name}</strong>
        <br>

        ${item.price} ريال x ${item.quantity}

        <br>

        <button onclick="changeQuantity(${index},-1)">-</button>

        <button onclick="changeQuantity(${index},1)">+</button>

        <button onclick="removeItem(${index})">✕</button>

        </div>

        `;

    });


    if(cartTotal)
        cartTotal.innerHTML = total.toFixed(2);

    if(cartCount)
        cartCount.innerHTML = count;

}



window.changeQuantity = function(index,value){

    cart[index].quantity += value;

    if(cart[index].quantity <= 0){
        cart.splice(index,1);
    }

    updateCart();

};



window.removeItem = function(index){

    cart.splice(index,1);

    updateCart();

};



window.openCart = function(){

    document.getElementById("cartBox").style.display="block";

};



window.closeCart = function(){

    document.getElementById("cartBox").style.display="none";

};



window.checkout = function(){

    if(cart.length === 0){

        alert("Your cart is empty");
        return;

    }


    alert("Thank you for shopping with BARQ ❤️");


    cart=[];

    updateCart();

    closeCart();

};




/* LOGIN SYSTEM */


window.showLogin = function(){

    document.getElementById("loginBox").style.display="block";

};



window.closeLogin = function(){

    document.getElementById("loginBox").style.display="none";

};



window.registerUser = async function(){

    let email = document.getElementById("email").value;

    let password = document.getElementById("password").value;


    try{

        await register(email,password);

        alert("Account created successfully");

    }

    catch(error){

        alert(error.message);

    }

};




window.loginUser = async function(){

    let email = document.getElementById("email").value;

    let password = document.getElementById("password").value;


    try{

        await login(email,password);

        alert("Login successful");

        closeLogin();

    }

    catch(error){

        alert(error.message);

    }

};




window.logoutUser = async function(){

    await logout();

    alert("Logged out");

};
window.openLogin=function(){

document.getElementById("loginBox").style.display="block";

};



window.closeLogin=function(){

document.getElementById("loginBox").style.display="none";

};
