import { db } from "./firebase-config.js";

import {
doc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


console.log("PRODUCT DETAILS JS STARTED");


const params = new URLSearchParams(
window.location.search
);


const productId = params.get("id");


const container =
document.getElementById("productDetails");



async function loadProduct(){


console.log("PRODUCT ID:", productId);



if(!productId){

container.innerHTML =
"<h2>No product id</h2>";

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



console.log("FIREBASE RESULT:", snap.exists());



if(!snap.exists()){


container.innerHTML =
"<h2>Product not found</h2>";

return;

}



const product =
snap.data();



console.log("PRODUCT:", product);



container.innerHTML = `


<div class="product-details-page">


<div class="product-image-box">


<img src="${product.image}">


</div>



<div class="product-info">


<h1>
${product.name}
</h1>


<h3>
${product.brand || "BARQ"}
</h3>



<div class="price-box">

${product.price} SAR

</div>



<p>
${product.description || ""}
</p>



<h3>
Choose Color
</h3>


<div class="option-buttons">

${(product.colors || []).map(
color=>`

<button>
${color}
</button>

`
).join("")}

</div>




<h3>
Choose Size
</h3>


<div class="option-buttons">


${(product.sizes || []).map(
size=>`

<button>
${size}
</button>

`
).join("")}


</div>




<button
class="add-cart-btn"

onclick="addToCart(
'${snap.id}',
'${product.name}',
${product.price},
'${product.image}',
'${product.brand || ""}'
)"

>

Add To Cart

</button>



</div>


</div>


`;



}


catch(error){


console.error(
"PRODUCT DETAILS ERROR:",
error
);


container.innerHTML =
"<h2>Error loading product</h2>";

}



}



loadProduct();
