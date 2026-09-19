function displayProducts(products){

const container =
document.querySelector(".product-container");


console.log(
"DISPLAY PRODUCTS:",
products
);


if(!container){

console.error(
"NO PRODUCT CONTAINER"
);

return;

}


container.innerHTML = "";


products.forEach((product)=>{


const card =
document.createElement("div");


card.className =
"product";



card.innerHTML = `

<div class="product-click">

<img
class="product-img"
src="${product.image}"
alt="${product.name}">


<h3>
${product.name}
</h3>


<p class="brand">
${product.brand || "BARQ"}
</p>


<p class="price">
${Number(product.price).toFixed(2)} SAR
</p>


</div>



<button class="add-btn">
Add To Cart
</button>

`;




// PRODUCT DETAILS CLICK ONLY HERE

const productArea =
card.querySelector(".product-click");


productArea.onclick = ()=>{


window.location.href =
"./product-details.html?id=" + product.id;


};




// ADD TO CART BUTTON

const addButton =
card.querySelector(".add-btn");


addButton.onclick = (event)=>{


event.stopPropagation();


addToCart(

product.id,

product.name,

product.price,

product.image,

product.brand

);


};



container.appendChild(card);



});


console.log(
"PRODUCT CARDS CREATED"
);


}
