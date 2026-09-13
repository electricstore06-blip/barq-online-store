import { db } from "./firebase-config.js";

import {
collection,
getDocs
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



let productsData = [];

let cart = JSON.parse(localStorage.getItem("barqCart")) || [];




// =========================
// LOAD PRODUCTS
// =========================


async function loadProducts(){


try{


const snapshot = await getDocs(collection(db,"products"));


productsData=[];



snapshot.forEach((doc)=>{


productsData.push({

id:doc.id,

...doc.data()

});


});



displayProducts(productsData);



}

catch(error){


console.log(error);


}



}





// =========================
// DISPLAY PRODUCTS
// =========================


function displayProducts(products){


let container=document.querySelector(".product-container");


if(!container) return;



container.innerHTML="";



products.forEach(product=>{



let card=document.createElement("div");


card.className="product";



card.innerHTML=`


<img 
class="product-img"
src="${product.image || 'barq-new.png'}"
>


<h3>

${product.name || "BARQ Product"}

</h3>



<p class="brand">

${product.brand || "BARQ"}

</p>




<div class="stars">

⭐⭐⭐⭐⭐

</div>




<p class="price">

${product.price || 0} ريال

</p>





<div class="product-actions">


<button class="view-btn">

View Details

</button>



<button class="add-btn">

Add To Cart

</button>



<button class="heart-btn">

❤️

</button>



</div>



`;





card.querySelector(".add-btn")
.onclick=()=>{


addToCart(

product.name,

product.price

);


};






card.querySelector(".view-btn")
.onclick=()=>{


showDetails(product);


};




container.appendChild(card);



});



}







// =========================
// SEARCH
// =========================



let search=document.getElementById("searchInput");



if(search){


search.addEventListener("input",()=>{


let value=search.value.toLowerCase();



let result=productsData.filter(product=>



(product.name || "")
.toLowerCase()
.includes(value)



);



displayProducts(result);



});


}






// =========================
// PRODUCT DETAILS
// =========================



function showDetails(product){



alert(

`
${product.name}

Brand:
${product.brand || "BARQ"}

Price:
${product.price} ريال


${product.description || "Premium beauty product"}

`

);



}






// =========================
// CART SYSTEM
// =========================



function saveCart(){


localStorage.setItem(

"barqCart",

JSON.stringify(cart)

);


}





function addToCart(name,price){



let item=cart.find(

x=>x.name===name

);



if(item){


item.quantity++;


}

else{


cart.push({

name:name,

price:Number(price),

quantity:1


});


}



saveCart();


updateCart();


}







function openCart(){


document.getElementById("cartBox")
.style.display="block";


updateCart();


}





function closeCart(){


document.getElementById("cartBox")
.style.display="none";


}





function updateCart(){



let items=document.getElementById("cartItems");

let total=document.getElementById("cartTotal");

let count=document.getElementById("cartCount");



if(!items)return;



items.innerHTML="";


let sum=0;

let qty=0;



cart.forEach((item,index)=>{


qty += item.quantity;



items.innerHTML +=`


<div class="cart-item">


<b>
${item.name}
</b>


<br>


${item.price} ريال



<br>


<button onclick="decreaseQty(${index})">

-

</button>



${item.quantity}



<button onclick="increaseQty(${index})">

+

</button>




<button onclick="removeCart(${index})">

X

</button>



</div>


`;



sum += item.price * item.quantity;



});





total.innerHTML=sum;


count.innerHTML=qty;



saveCart();



}






function increaseQty(index){


cart[index].quantity++;


updateCart();


}




function decreaseQty(index){



if(cart[index].quantity>1){


cart[index].quantity--;

}

else{


cart.splice(index,1);


}


updateCart();


}






function removeCart(index){


cart.splice(index,1);


updateCart();


}





function checkout(){


window.location.href="checkout.html";


}







// GLOBAL BUTTONS


window.openCart=openCart;

window.closeCart=closeCart;

window.addToCart=addToCart;

window.checkout=checkout;

window.increaseQty=increaseQty;

window.decreaseQty=decreaseQty;

window.removeCart=removeCart;




loadProducts();

updateCart();
