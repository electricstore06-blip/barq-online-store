let cart = [];


function addToCart(name,price){

let item = cart.find(
product => product.name === name
);


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

}




function updateCart(){


let box=document.getElementById("cartItems");

let total=document.getElementById("cartTotal");


box.innerHTML="";


let sum=0;



cart.forEach((item,index)=>{


sum += item.price * item.quantity;



box.innerHTML += `


<div class="cart-product">


<b>${item.name}</b>

<br>

${item.price} ريال x ${item.quantity}



<button onclick="changeQuantity(${index},-1)">
-
</button>



<button onclick="changeQuantity(${index},1)">
+
</button>



<button onclick="removeItem(${index})">
X
</button>



</div>


`;



});



total.innerHTML=sum.toFixed(2);



}




function changeQuantity(index,value){


cart[index].quantity += value;


if(cart[index].quantity <=0){

cart.splice(index,1);

}


updateCart();


}




function removeItem(index){

cart.splice(index,1);

updateCart();

}



function closeCart(){

document.getElementById("cartBox").style.display="none";

}



function checkout(){

alert("Thank you for your order!");

}
