import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const params =
new URLSearchParams(window.location.search);


const productId =
params.get("id");



const container =
document.getElementById("productDetails");



async function loadProduct(){


if(!productId){

container.innerHTML =
"<h2>Product not found</h2>";

return;

}



try{


const ref =
doc(
db,
"products",
productId
);



const snap =
await getDoc(ref);



if(!snap.exists()){


container.innerHTML =
"<h2>Product not found</h2>";


return;


}



const product =
snap.data();



container.innerHTML = `


<div class="product-details-page">



<div class="product-image-box">


<img 
src="${product.image}"
alt="${product.name}"
>


</div>




<div class="product-info">


<h1>
${product.name}
</h1>



<h3>
${product.brand || "BARQ"}
</h3>



<p>
${product.category || ""}
</p>



<div class="price-box">

${product.price} SAR

</div>



<p>

${product.description || 
"Premium quality product from BARQ Store."}

</p>




<div class="option-title">

Choose Color

</div>


<div class="option-buttons">


${
(product.colors || [])
.map(color =>

`

<button>
${color}
</button>

`

).join("")
}


</div>




<div class="option-title">

Choose Size

</div>


<div class="option-buttons">


${
(product.sizes || [])
.map(size =>

`

<button>
${size}
</button>

`

).join("")
}


</div>





<button 

class="add-cart-btn"

id="addCartButton"

>

Add To Cart

</button>



</div>


</div>


`;





document
.getElementById("addCartButton")
.onclick = ()=>{


addToCart(

productId,

product.name,

product.price,

product.image,

product.brand || "BARQ"

);


alert("Added to cart ✅");


};





}

catch(error){


console.error(
"Product loading error:",
error
);


container.innerHTML =
"<h2>Error loading product</h2>";


}



}



loadProduct();
