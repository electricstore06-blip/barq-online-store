import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// BARQ PRODUCTS
// ==========================================

let productsData = [];


// ==========================================
// CART
// ==========================================

let cart = JSON.parse(localStorage.getItem("barqCart")) || [];


// ==========================================
// LOAD PRODUCTS FROM FIRESTORE
// ==========================================

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

        console.error(
            "Firebase product loading error:",
            error
        );

        container.innerHTML = `
            <p>
                Unable to load products.
            </p>
        `;

    }
}


// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(products) {

    const container =
        document.querySelector(".product-container");

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

        const card =
            document.createElement("div");

        card.className = "product";


        const image =
            product.image &&
            product.image.startsWith("http")
                ? product.image
                : "https://images.unsplash.com/photo-1596462502278-27bfdc403348";


        card.innerHTML = `

            <img
                class="product-img"
                src="${image}"
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


        const addButton =
            card.querySelector(".add-btn");


        addButton.addEventListener(
            "click",
            () => {

                addToCart(
                    product.name ||
                    "BARQ Beauty Product",

                    Number(product.price || 0)
                );

            }
        );


        container.appendChild(card);

    });

}


// ==========================================
// SEARCH
// ==========================================

const searchInput =
    document.getElementById("searchInput");


if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const value =
                searchInput.value
                    .trim()
                    .toLowerCase();


            const results =
                productsData.filter(
                    (product) => {

                        const name =
                            (product.name || "")
                                .toLowerCase();

                        const brand =
                            (product.brand || "")
                                .toLowerCase();

                        const category =
                            (product.category || "")
                                .toLowerCase();


                        return (
                            name.includes(value) ||
                            brand.includes(value) ||
                            category.includes(value)
                        );

                    }
                );


            displayProducts(results);

        }
    );

}


// ==========================================
// SAVE CART
// ==========================================

function saveCart() {

    localStorage.setItem(
        "barqCart",
        JSON.stringify(cart)
    );

}


// ==========================================
// ADD TO CART
// ==========================================

function addToCart(name, price) {

    const existingItem =
        cart.find(
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


    // Small confirmation
    alert(
        name + " added to your cart."
    );

}


// ==========================================
// UPDATE CART
// ==========================================

function updateCart() {

    const items =
        document.getElementById("cartItems");

    const total =
        document.getElementById("cartTotal");

    const count =
        document.getElementById("cartCount");


    if (!items) return;


    items.innerHTML = "";


    let sum = 0;

    let quantity = 0;


    // EMPTY CART
    if (cart.length === 0) {

        items.innerHTML = `
            <p class="empty-cart">
                Your cart is empty.
            </p>
        `;

    }


    // CART ITEMS
    cart.forEach((item, index) => {

        const itemPrice =
            Number(item.price);

        const itemQuantity =
            Number(item.quantity);

        const itemTotal =
            itemPrice * itemQuantity;


        sum += itemTotal;

        quantity += itemQuantity;


        items.innerHTML += `

            <div class="cart-item">

                <div class="cart-item-info">

                    <b>
                        ${item.name}
                    </b>

                    <span>
                        ${itemPrice.toFixed(2)} SAR
                    </span>

                    <span>
                        Subtotal:
                        ${itemTotal.toFixed(2)} SAR
                    </span>

                </div>


                <div class="quantity-controls">

                    <button
                        class="quantity-btn"
                        onclick="decreaseQuantity(${index})"
                    >
                        −
                    </button>


                    <span class="quantity-number">
                        ${itemQuantity}
                    </span>


                    <button
                        class="quantity-btn"
                        onclick="increaseQuantity(${index})"
                    >
                        +
                    </button>

                </div>


                <button
                    class="remove-btn"
                    onclick="removeCart(${index})"
                >
                    Remove
                </button>

            </div>

        `;

    });


    if (total) {

        total.innerHTML =
            sum.toFixed(2);

    }


    if (count) {

        count.innerHTML =
            quantity;

    }


    saveCart();

}


// ==========================================
// INCREASE QUANTITY
// ==========================================

function increaseQuantity(index) {

    if (!cart[index]) return;


    cart[index].quantity++;


    saveCart();

    updateCart();

}


// ==========================================
// DECREASE QUANTITY
// ==========================================

function decreaseQuantity(index) {

    if (!cart[index]) return;


    cart[index].quantity--;


    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }


    saveCart();

    updateCart();

}


// ==========================================
// OPEN CART
// ==========================================

function openCart() {

    const cartBox =
        document.getElementById("cartBox");


    if (!cartBox) return;


    cartBox.style.display =
        "block";


    updateCart();

}


// ==========================================
// CLOSE CART
// ==========================================

function closeCart() {

    const cartBox =
        document.getElementById("cartBox");


    if (!cartBox) return;


    cartBox.style.display =
        "none";

}


// ==========================================
// REMOVE CART ITEM
// ==========================================

function removeCart(index) {

    if (!cart[index]) return;


    cart.splice(index, 1);


    saveCart();

    updateCart();

}


// ==========================================
// CHECKOUT
// ==========================================

function checkout() {

    if (cart.length === 0) {

        alert(
            "Your cart is empty."
        );

        return;

    }


    window.location.href =
        "checkout.html";

}


// ==========================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ==========================================

window.openCart =
    openCart;

window.closeCart =
    closeCart;

window.removeCart =
    removeCart;

window.increaseQuantity =
    increaseQuantity;

window.decreaseQuantity =
    decreaseQuantity;

window.checkout =
    checkout;


// ==========================================
// START BARQ STORE
// ==========================================

loadProducts();

updateCart();
