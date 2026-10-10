import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const container = document.getElementById("productDetails");

let product = null;
let selectedColor = "";
let selectedSize = "";

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Find the correct price for the selected size.
function getPrice(size = "") {
    const sizePrices = product?.sizePrices || {};

    if (size && Object.prototype.hasOwnProperty.call(sizePrices, size)) {
        const price = Number(sizePrices[size]);

        if (Number.isFinite(price) && price >= 0) {
            return price;
        }
    }

    return Number(product?.price) || 0;
}

// Display the selected price.
function updateDisplayedPrice() {
    const priceElement = document.getElementById("selectedPrice");

    if (priceElement) {
        priceElement.textContent =
            `${getPrice(selectedSize).toFixed(2)} SAR`;
    }
}

async function loadProduct() {
    if (!container) {
        console.error("Product details container not found.");
        return;
    }

    if (!productId) {
        container.innerHTML = "<h2>Product not found.</h2>";
        return;
    }

    try {
        const productRef = doc(db, "products", productId);
        const snapshot = await getDoc(productRef);

        if (!snapshot.exists()) {
            container.innerHTML = "<h2>Product not found.</h2>";
            return;
        }

        product = {
            id: snapshot.id,
            ...snapshot.data()
        };

        const colors = Array.isArray(product.colors)
            ? product.colors
            : [];

        const sizes = Array.isArray(product.sizes)
            ? product.sizes
            : [];

        selectedColor = "";
        selectedSize = "";

        container.innerHTML = `
            <div class="product-details-page">

                <div class="product-image-box">
                    <img
                        src="${escapeHTML(product.image || "")}"
                        alt="${escapeHTML(product.name || "Product")}"
                    >
                </div>

                <div class="product-info">

                    <h1>${escapeHTML(product.name || "Product")}</h1>

                    <h3>${escapeHTML(product.brand || "BARQ")}</h3>

                    <div class="price-box" id="selectedPrice">
                        ${getPrice().toFixed(2)} SAR
                    </div>

                    <p>${escapeHTML(product.description || "")}</p>

                    ${
                        colors.length
                            ? `
                                <h3 class="option-title">Choose Color</h3>

                                <div class="option-buttons" id="colorOptions">
                                    ${colors.map(color => `
                                        <button
                                            type="button"
                                            class="variant-button"
                                            data-color="${escapeHTML(color)}"
                                            aria-pressed="false"
                                        >${escapeHTML(color)}</button>
                                    `).join("")}
                                </div>
                            `
                            : ""
                    }

                    ${
                        sizes.length
                            ? `
                                <h3 class="option-title">Choose Size</h3>

                                <div class="option-buttons" id="sizeOptions">
                                    ${sizes.map(size => `
                                        <button
                                            type="button"
                                            class="variant-button"
                                            data-size="${escapeHTML(size)}"
                                            aria-pressed="false"
                                        >${escapeHTML(size)}</button>
                                    `).join("")}
                                </div>
                            `
                            : ""
                    }

                    <button
                        type="button"
                        class="add-cart-btn"
                        id="addProductToCart"
                    >
                        Add To Cart
                    </button>

                </div>
            </div>
        `;

        // Select a color.
        container.querySelectorAll("[data-color]").forEach(button => {
            button.addEventListener("click", () => {
                selectedColor = button.dataset.color;

                container.querySelectorAll("[data-color]").forEach(option => {
                    const active = option === button;

                    option.setAttribute("aria-pressed", String(active));
                    option.style.background = active ? "#d4145a" : "white";
                    option.style.color = active ? "white" : "black";
                });
            });
        });

        // Select a size and immediately update the price.
        container.querySelectorAll("[data-size]").forEach(button => {
            button.addEventListener("click", () => {
                selectedSize = button.dataset.size;

                container.querySelectorAll("[data-size]").forEach(option => {
                    const active = option === button;

                    option.setAttribute("aria-pressed", String(active));
                    option.style.background = active ? "#d4145a" : "white";
                    option.style.color = active ? "white" : "black";
                });

                updateDisplayedPrice();

                console.log(
                    "Selected size:",
                    selectedSize,
                    "Selected price:",
                    getPrice(selectedSize),
                    "Saved size prices:",
                    product.sizePrices
                );
            });
        });

        // Add the selected product, size, color, and price to the cart.
        document.getElementById("addProductToCart").addEventListener("click", () => {
            if (colors.length && !selectedColor) {
                alert("Please choose a color first.");
                return;
            }

            if (sizes.length && !selectedSize) {
                alert("Please choose a size first.");
                return;
            }

            if (typeof window.addToCart !== "function") {
                alert("Cart is unavailable. Please refresh the page.");
                return;
            }

            const selectedPrice = getPrice(selectedSize);

            window.addToCart(
                product.id,
                product.name,
                selectedPrice,
                product.image || "",
                product.brand || "BARQ",
                selectedColor,
                selectedSize
            );
        });

    } catch (error) {
        console.error("Product details error:", error);
        container.innerHTML =
            "<h2>Unable to load product. Please refresh.</h2>";
    }
}

loadProduct();
