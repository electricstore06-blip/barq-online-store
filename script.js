let cart=[];


function addToCart(name,price){

cart.push({
name:name,
price:price
});


document.getElementById("cartCount").innerHTML = cart.length;


}



function openCart(){

document.getElementById("cartBox").style.display="block";

}



function closeCart(){

document.getElementById("cartBox").style.display="none";

}
