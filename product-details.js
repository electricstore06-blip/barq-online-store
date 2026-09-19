import { db } from "./firebase-config.js";

import {
doc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const params = new URLSearchParams(
window.location.search
);


const productId = params.get("id");


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


<div class="product-details-box">



<img

src="${product.image}"

class="details-image"

onerror="this.style.display='none'"

>



<h1>
${product.name}
</h1>



<h3>
${product.brand || ""}
</h3>



<h2>
${product.price} SAR
</h2>



<p>
${product.description || ""}
</p>



<h3>
Choose Color
</h3>


<div class="options">

${(product.colors || []).map(color=>`

<button>
${color}
</button>

`).join("")}

</div>




<h3>
Choose Size
</h3>


<div class="options">

${(product.sizes || []).map(size=>`

<button>
${size}
</button>

`).join("")}

</div>




<button

class="add-cart-details"

onclick="
addToCart(
'${snap.id}',
'${product.name}',
${product.price},
'${product.image}',
'${product.brand}'
)
">

Add To Cart

</button>



</div>


`;



}

catch(error){

console.error(error);

container.innerHTML =
"<h2>Error loading product</h2>";

}


}



loadProduct();
