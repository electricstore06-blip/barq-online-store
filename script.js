// ==========================================
// BARQ STORE SCRIPT
// ==========================================


import { db } from "./firebase-config.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// ==========================================
// VARIABLES
// ==========================================

let productsData = [];

let cart =
JSON.parse(localStorage.getItem("barqCart")) || [];




// ==========================================
// LOAD PRODUCTS
// ==========================================


async function loadProducts(){


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



        productsData = [];



        snapshot.forEach((doc)=>{


            productsData.push({

                id:doc.id,

                ...doc.data()

            });


        });



        displayProducts(productsData);



    }

    catch(error){


        console.error(
            "Firebase error:",
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


    const container =
    document.querySelector(".product-container");


    if(!container) return;



    container.innerHTML="";



    products.forEach((product)=>{


        const card =
        document.createElement("div");

        card.className="product";



        let image =
        product.image ||
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348";



        let name =
        product.name ||
        "Beauty Product";



        let brand =
        product.brand ||
        "BARQ";



        let price =
        Number(product.price || 0);



        card.innerHTML = `


        <img 
        class="product-img"
        src="${image}"
        >


        <h3>
        ${name}
        </h3>


        <p class="brand">
        ${brand}
        </p>


        <p class="price">
        ${price.toFixed(2)} SAR
        </p>


        <button 
        class="add-btn">

        Add To Cart

        </button>


        `;



        card
        .querySelector(".add-btn")
        .onclick=function(){


            addToCart(
                product.id,
                name,
                price,
                image,
                brand
            );


        };



        container.appendChild(card);



    });



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


let value =
searchInput.value.toLowerCase();



let result =
productsData.filter(product=>{


return (

(product.name || "")
.toLowerCase()
.includes(value)


||

(product.brand || "")
.toLowerCase()
.includes(value)


);


});



displayProducts(result);



});


}






// ==========================================
// CART
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


let item =
cart.find(
x=>x.productId===id
);



if(item){


item.quantity++;


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



}




function updateCart(){


const items =
document.getElementById("cartItems");


const total =
document.getElementById("cartTotal");


const count =
document.getElementById("cartCount");



if(!items) return;



items.innerHTML="";


let sum=0;

let qty=0;




cart.forEach(
(item,index)=>{


let itemTotal =
item.price *
item.quantity;



sum += itemTotal;

qty += item.quantity;



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



<button 
class="remove-btn"
onclick="removeCart(${index})">

Remove

</button>


</div>


`;



});




if(total)
total.innerText =
sum.toFixed(2);



if(count)
count.innerText =
qty;



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
// OPEN CLOSE CART
// ==========================================


function openCart(){


document.getElementById("cartBox")
.style.display="block";


updateCart();


}



function closeCart(){


document.getElementById("cartBox")
.style.display="none";


}




function checkout(){


if(cart.length===0){


alert(
"Your cart is empty"
);


return;


}


window.location.href=
"checkout.html";


}




// ==========================================
// MOBILE MENU
// ==========================================
function toggleMenu(){

    const menu =
        document.getElementById("mainNav");


    if(!menu) return;


    menu.classList.toggle("active");


}
// CLOSE MOBILE MENU AFTER CLICK

document.addEventListener("DOMContentLoaded",()=>{

    const menuLinks =
        document.querySelectorAll("#mainNav a");


    menuLinks.forEach(link=>{

        link.addEventListener("click",()=>{

            const menu =
                document.getElementById("mainNav");


            if(menu){

                menu.classList.remove("active");

            }

        });

    });

});



// ==========================================
// MAKE AVAILABLE FOR HTML
// ==========================================


window.toggleMenu =
toggleMenu;


window.openCart =
openCart;


window.closeCart =
closeCart;


window.checkout =
checkout;


window.removeCart =
removeCart;


window.increaseQuantity =
increaseQuantity;


window.decreaseQuantity =
decreaseQuantity;




// ==========================================
// START
// ==========================================


loadProducts();


updateCart();
