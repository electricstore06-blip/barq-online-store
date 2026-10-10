// ==========================================
// BARQ STORE MAIN SCRIPT
// ==========================================


import { db } from "./firebase-config.js";


import {
    collection,
    getDocs
} 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// ==========================================
// VARIABLES
// ==========================================


let productsData = [];


let cart =
JSON.parse(localStorage.getItem("barqCart")) || [];





// ==========================================
// LOAD PRODUCTS FROM FIREBASE
// ==========================================


async function loadProducts(){
console.log("LOAD PRODUCTS STARTED");

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
console.log("PRODUCT COUNT:", snapshot.size);


productsData = [];


snapshot.forEach((doc)=>{

console.log("PRODUCT DATA:", doc.id, doc.data());

productsData.push({

id:doc.id,

...doc.data()

});

});



displayProducts(productsData);



}


catch(error){


console.error(
"Firebase Products Error:",
error
);



container.innerHTML =
"<p>Unable to load products</p>";


}



}

// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(products) {
    const container = document.querySelector(
        "#products .product-container"
    );

    if (!container) {
        console.error("Product container not found.");
        return;
    }

    // Clear the old product cards.
    container.innerHTML = "";

    // Show a message if there are no products.
    if (!Array.isArray(products) || products.length === 0) {
        container.innerHTML = `
            <p class="no-products">
                No products available right now.
            </p>
        `;
        return;
    }

    products.forEach((product) => {
        const card = document.createElement("div");
        card.className = "product";

        const productArea = document.createElement("div");
        productArea.className = "product-click";

        const image = document.createElement("img");
        image.className = "product-img";
        image.src = product.image || "";
        image.alt = product.name || "Product";
        image.loading = "lazy";

        image.onerror = function () {
            this.style.display = "none";
        };

        const name = document.createElement("h3");
        name.textContent = product.name || "Product";

        const brand = document.createElement("p");
        brand.className = "brand";
        brand.textContent = product.brand || "BARQ";

        const price = document.createElement("p");
        price.className = "price";

        const numericPrice = Number(product.price);
        price.textContent =
            (Number.isFinite(numericPrice) ? numericPrice : 0).toFixed(2)
            + " SAR";

        productArea.append(image, name, brand, price);

        productArea.addEventListener("click", function () {
            window.location.href =
                "./product-details.html?id=" +
                encodeURIComponent(product.id);
        });

        const button = document.createElement("button");
        button.className = "add-btn";
        button.textContent = "Add To Cart";

        button.addEventListener("click", function (event) {
            event.stopPropagation();

            addToCart(
                product.id,
                product.name,
                product.price,
                product.image,
                product.brand
            );
        });

        card.append(productArea, button);
        container.appendChild(card);
    });

    console.log("Products displayed:", products.length);
}



// ==========================================
// BARQ PRODUCT SEARCH
// ==========================================

const searchInput = document.getElementById("searchInput");
const searchResultsSection = document.getElementById("searchResultsSection");
const searchResultsContainer = document.getElementById("searchResultsContainer");

if (searchInput) {
    searchInput.addEventListener("input", function () {
        const value = searchInput.value.trim().toLowerCase();

        const originalContainer = document.querySelector(
            "#products .product-container"
        );

        // Empty search: restore the normal homepage.
        if (!value) {
            if (searchResultsSection) {
                searchResultsSection.hidden = true;
            }

            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = "";
            }

            if (originalContainer) {
                originalContainer.style.display = "";
            }

            return;
        }

        // Search the actual products loaded from Firebase.
        const results = productsData.filter((product) => {
            const name = String(product.name || "").toLowerCase();
            const brand = String(product.brand || "").toLowerCase();
            const category = String(product.category || "").toLowerCase();

            return (
                name.includes(value) ||
                brand.includes(value) ||
                category.includes(value)
            );
        });

        // Show search results below the search bar.
        if (searchResultsSection && searchResultsContainer) {
            searchResultsSection.hidden = false;

            searchResultsContainer.innerHTML = "";

            if (results.length === 0) {
                searchResultsContainer.innerHTML = `
                    <p class="no-search-results">
                        No products found. Try another product name or brand.
                    </p>
                `;
            } else {
                results.forEach((product) => {
                    const card = document.createElement("div");
                    card.className = "product";

                    const productArea = document.createElement("div");
                    productArea.className = "product-click";

                    const image = document.createElement("img");
                    image.className = "product-img";
                    image.src = product.image || "";
                    image.alt = product.name || "Product";
                    image.loading = "lazy";

                    image.onerror = function () {
                        this.style.display = "none";
                    };

                    const name = document.createElement("h3");
                    name.textContent = product.name || "Product";

                    const brand = document.createElement("p");
                    brand.className = "brand";
                    brand.textContent = product.brand || "BARQ";

                    const price = document.createElement("p");
                    price.className = "price";

                    const numericPrice = Number(product.price);
                    price.textContent =
                        (Number.isFinite(numericPrice) ? numericPrice : 0)
                            .toFixed(2) + " SAR";

                    productArea.append(image, name, brand, price);

                    productArea.addEventListener("click", function () {
                        window.location.href =
                            "./product-details.html?id=" +
                            encodeURIComponent(product.id);
                    });

                    const button = document.createElement("button");
                    button.className = "add-btn";
                    button.textContent = "Add To Cart";

                    button.addEventListener("click", function (event) {
                        event.stopPropagation();

                        addToCart(
                            product.id,
                            product.name,
                            product.price,
                            product.image,
                            product.brand
                        );
                    });

                    card.append(productArea, button);
                    searchResultsContainer.appendChild(card);
                });
            }

            // Keep the original featured products section unchanged.
            // Search results are displayed separately above it.
            searchResultsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        } else {
            // Fallback if the separate results section is missing.
            if (!originalContainer) {
                console.error("Product container was not found.");
                return;
            }

            if (results.length === 0) {
                originalContainer.innerHTML =
                    "<p>No products found. Try another name or brand.</p>";
            } else {
                displayProducts(results);
            }
        }
    });
}

// ==========================================
// BARQ CATEGORY FILTER
// ==========================================

document.querySelectorAll(".beauty-category-card").forEach((card) => {
    card.addEventListener("click", function (event) {
        event.preventDefault();

        const category = this.dataset.category;

        // Support common category names and variations.
        const categoryAliases = {
           makeup: ["makeup", "cosmetics", "make up", "beauty"], 
            skincare: ["skincare", "skin care", "skin-care"],
            perfume: ["perfume", "fragrance", "fragrances"],
            haircare: ["haircare", "hair care", "hair-care"],
            fashion: [
                "fashion",
                "accessories",
                "fashion & accessories",
                "fashion and accessories"
            ]
        };

        const matchingNames = categoryAliases[category] || [category];

        const filteredProducts = productsData.filter((product) => {
            const productCategory = String(product.category || "")
                .trim()
                .toLowerCase();

            return matchingNames.includes(productCategory);
        });

        // Display matching products in the existing product section.
        const productsSection = document.getElementById("products");

        if (!productsSection) return;

        // Hide search results so they don't confuse the customer.
        const searchResults = document.getElementById("searchResultsSection");

        if (searchResults) {
            searchResults.hidden = true;
        }

        // Clear the search box.
        const searchInput = document.getElementById("searchInput");

        if (searchInput) {
            searchInput.value = "";
        }

        // Display matching products.
        const title = productsSection.querySelector("h2");

        if (title) {
            title.textContent =
                category.charAt(0).toUpperCase() + category.slice(1) +
                " Products";
        }

        displayProducts(filteredProducts);

        // Move the customer to the product list.
        productsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});

// ==========================================
// CART SYSTEM
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
  brand,
  color = "",
  size = ""
) {
  const selectedPrice = Number(price);

  if (!Number.isFinite(selectedPrice) || selectedPrice < 0) {
    alert("Invalid product price.");
    return;
  }

  // Match the same product only when its selected options also match.
  const existing = cart.find(item =>
    item.productId === id &&
    (item.color || "") === color &&
    (item.size || "") === size &&
    Number(item.price) === selectedPrice
  );

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      productId: id,
      name: name,
      price: selectedPrice,
      image: image,
      brand: brand,
      color: color,
      size: size,
      quantity: 1
    });
  }

  saveCart();
  updateCart();

  alert("Added to cart ✅");
}


// ==========================================
// CART OPEN CLOSE
// ==========================================



function openCart(){


const box =
document.getElementById("cartBox");



if(box){

box.style.display="block";

}



updateCart();



}






function closeCart(){


const box =
document.getElementById("cartBox");



if(box){

box.style.display="none";

}



}








function checkout(){


if(cart.length===0){


alert(
"Your cart is empty"
);


return;


}



window.location.href =
"checkout.html";



}








// ==========================================
// MOBILE MENU
// ==========================================


function toggleMenu(){


const menu =
document.getElementById("mainNav");



if(menu){

menu.classList.toggle("active");

}


}







document.addEventListener(
"DOMContentLoaded",
()=>{


const links =
document.querySelectorAll(
"#mainNav a"
);



links.forEach(link=>{


link.addEventListener(
"click",
()=>{


const menu =
document.getElementById("mainNav");



if(menu){

menu.classList.remove("active");

}


});


});



});









// ==========================================
// EXPORT TO HTML
// ==========================================
window.addToCart = addToCart;
window.toggleMenu = toggleMenu;
window.openCart = openCart;
window.closeCart = closeCart;
window.checkout = checkout;
window.removeCart = removeCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;

const menuButton =
document.getElementById("menuButton");


if(menuButton){

menuButton.addEventListener(
"click",
toggleMenu
);

}


// ==========================================
// START
// ==========================================


loadProducts();


updateCart();
