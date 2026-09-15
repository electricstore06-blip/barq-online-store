import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==============================
// BARQ PRODUCTS
// ==============================

let productsData = [];


// ==============================
// CART
// ==============================

let cart = JSON.parse(localStorage.getItem("barqCart")) || [];


// ==============================
// LOAD PRODUCTS FROM FIRESTORE
// ==============================

async function loadProducts() {

    const container = document.querySelector(".product-container");

    if (!container) return;

    container.innerHTML = "<p>Loading products...</p>";

    try {

        const snapshot = await getDocs(
            collection(db, "products")
        );

        productsData = [];

        snapshot.forEach((doc) => {

            productsData.push({
                id: doc.id,
                ...doc.data()
            });

        });

        displayProducts(productsData);

    } catch (error) {

        console.error("Firebase product loading error:", error);

        container.innerHTML = `
            <p>
                Unable to load products.
            </p>
        `;

    }

}


// ==============================
// DISPLAY PRODUCTS
// ==============================

function displayProducts(products) {

    const container = document.querySelector(".product-container");

    if (!container) return;

    container.innerHTML = "";


    if (products.length === 0) {

        container.innerHTML = `
            <p>
                No products found.
            </p>
        `;

        return;

    }


    products.forEach((product) => {

        const card = document.createElement("div");

        card.className = "product";


        card.innerHTML = `

            <img
                class="product-img"
               src="${product.image && product.image.startsWith("http") ? product.image : "https://images.unsplash.com/photo-1596462502278-27bfdc403348"}"
                alt="${product.name || "BARQ Beauty Product"}"
            >

            <h3>
                ${product.name || "BARQ Beauty Product"}
            </h3>

            <p class="brand">
                ${product.brand || "BARQ"}
            </p>

            <p class="price">
                ${Number(product.price || 0).toFixed(2)} SAR
            </p>

            <button class="add-btn">
                Add To Cart
            </button>

        `;


        const addButton = card.querySelector(".add-btn");


        addButton.addEventListener("click", () => {

            addToCart(
                product.name || "BARQ Beauty Product",
                Number(product.price || 0)
            );

        });


        container.appendChild(card);

    });

}


// ==============================
// SEARCH
// ==============================

const searchInput = document.getElementById("searchInput");


if (searchInput) {

    searchInput.addEventListener("input", () => {

        const value = searchInput.value
            .trim()
            .toLowerCase();


        const results = productsData.filter((product) => {

            const name = (product.name || "").toLowerCase();

            const brand = (product.brand || "").toLowerCase();

            return (
                name.includes(value) ||
                brand.includes(value)
            );

        });


        displayProducts(results);

    });

}


// ==============================
// SAVE CART
// ==============================

function saveCart() {

    localStorage.setItem(
        "barqCart",
        JSON.stringify(cart)
    );

}


// ==============================
// ADD TO CART
// ==============================

function addToCart(name, price) {

    const existingItem = cart.find(
        (item) => item.name === name
    );


    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({

            name: name,

            price: Number(price),

            quantity: 1

        });

    }


    saveCart();

    updateCart();

}


// ==============================
// UPDATE CART
// ==============================

function updateCart() {

    const items = document.getElementById("cartItems");

    const total = document.getElementById("cartTotal");

    const count = document.getElementById("cartCount");


    if (!items) return;


    items.innerHTML = "";


    let sum = 0;

    let quantity = 0;


    cart.forEach((item, index) => {

        const itemTotal =
            Number(item.price) * Number(item.quantity);


        sum += itemTotal;

        quantity += Number(item.quantity);


        items.innerHTML += `

            <div class="cart-item">

                <b>
                    ${item.name}
                </b>

                <br>

                ${Number(item.price).toFixed(2)} SAR

                <br>

                Quantity:
                ${item.quantity}

                <button
                    onclick="removeCart(${index})"
                >
                    X
                </button>

            </div>

        `;

    });


    if (total) {

        total.innerHTML = sum.toFixed(2);

    }


    if (count) {

        count.innerHTML = quantity;

    }


    saveCart();

}


// ==============================
// OPEN CART
// ==============================

function openCart() {

    const cartBox =
        document.getElementById("cartBox");


    if (!cartBox) return;


    cartBox.style.display = "block";

    updateCart();

}


// ==============================
// CLOSE CART
// ==============================

function closeCart() {

    const cartBox =
        document.getElementById("cartBox");


    if (!cartBox) return;


    cartBox.style.display = "none";

}


// ==============================
// REMOVE CART ITEM
// ==============================

function removeCart(index) {

    cart.splice(index, 1);

    saveCart();

    updateCart();

}


// ==============================
// CHECKOUT
// ==============================

function checkout() {

    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;

    }


    window.location.href = "checkout.html";

}


// ==============================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ==============================

window.openCart = openCart;

window.closeCart = closeCart;

window.removeCart = removeCart;

window.checkout = checkout;


// ==============================
// START BARQ STORE
// ==============================

loadProducts();

updateCart();
