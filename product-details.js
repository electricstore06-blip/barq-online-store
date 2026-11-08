
import { db } from "./firebase-config.js";

import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const container = document.getElementById("productDetails");

let product = null;
let selectedColor = "";
let selectedSize = "";
let stockUnsubscribe = null;

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getAvailableStock() {
    const stock = Number(product?.stock);

    if (
        product?.stock === undefined ||
        product?.stock === null ||
        product?.stock === ""
    ) {
        return null;
    }

    return Number.isFinite(stock) ? Math.max(0, stock) : 0;
}

function getPrice(size = "") {
    if (!product) return 0;

    const sizePrices = product.sizePrices || {};

    if (size && sizePrices[size] !== undefined) {
        const price = Number(sizePrices[size]);
        if (Number.isFinite(price)) return price;
    }

    if (size && product[size] !== undefined) {
        const price = Number(product[size]);
        if (Number.isFinite(price)) return price;
    }

    const match = String(size).match(/\d+/);

    if (match) {
        const numberKey = match[0];

        if (sizePrices[numberKey] !== undefined) {
            const price = Number(sizePrices[numberKey]);
            if (Number.isFinite(price)) return price;
        }

        if (product[numberKey] !== undefined) {
            const price = Number(product[numberKey]);
            if (Number.isFinite(price)) return price;
        }
    }

    return Number(product.price) || 0;
}

function updateDisplayedPrice() {
    const priceElement = document.getElementById("selectedPrice");

    if (priceElement) {
        priceElement.textContent =
            `${getPrice(selectedSize).toFixed(2)} SAR`;
    }
}

function updateStockDisplay() {
    const stockElement = document.getElementById("productStockStatus");
    const addButton = document.getElementById("addProductToCart");

    if (!stockElement || !addButton || !product) return;

    const stock = getAvailableStock();

    // Products without a stock field retain their previous behavior.
    if (stock === null) {
        stockElement.textContent = "";
        addButton.disabled = false;
        addButton.textContent = "Add To Cart";
        return;
    }

    if (stock <= 0) {
        stockElement.textContent = "Out of Stock";
        stockElement.style.color = "#dc2626";
        addButton.disabled = true;
        addButton.textContent = "Out of Stock";
    } else {
        stockElement.textContent = `In Stock (${stock} available)`;
        stockElement.style.color = "#15803d";
        addButton.disabled = false;
        addButton.textContent = "Add To Cart";
    }
}

function startStockListener() {
    if (!productId) return;

    const productRef = doc(db, "products", productId);

    stockUnsubscribe = onSnapshot(
        productRef,
        snapshot => {
            if (!snapshot.exists()) {
                container.innerHTML = "<h2>Product not found.</h2>";
                product = null;
                return;
            }

            product = {
                id: snapshot.id,
                ...snapshot.data()
            };

            if (product.active === false) {
                container.innerHTML =
                    "<h2>This product is currently unavailable.</h2>";
                product = null;
                return;
            }

            updateStockDisplay();

            console.log(
                "Live product stock updated:",
                product.name,
                product.stock
            );
        },
        error => {
            console.error("Stock listener error:", error);
            const stockElement =
                document.getElementById("productStockStatus");

            if (stockElement) {
                stockElement.textContent =
                    "Unable to verify current stock.";
            }

            const addButton =
                document.getElementById("addProductToCart");

            if (addButton) addButton.disabled = true;
        }
    );
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

        // Initial load. The live listener below keeps stock updated.
        const { getDoc } = await import(
            "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
        );

        const snapshot = await getDoc(productRef);

        if (!snapshot.exists()) {
            container.innerHTML = "<h2>Product not found.</h2>";
            return;
        }

        product = {
            id: snapshot.id,
            ...snapshot.data()
        };

        if (product.active === false) {
            container.innerHTML =
                "<h2>This product is currently unavailable.</h2>";
            return;
        }

        console.log("Loaded product:", product);

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

                    <p id="productStockStatus"></p>

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

        updateStockDisplay();

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
            });
        });

        document.getElementById("addProductToCart")
            .addEventListener("click", () => {

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

                const stock = getAvailableStock();

                if (stock !== null && stock <= 0) {
                    alert("Sorry, this product is out of stock.");
                    return;
                }

                window.addToCart(
                    product.id,
                    product.name,
                    getPrice(selectedSize),
                    product.image || "",
                    product.brand || "BARQ",
                    selectedColor,
                    selectedSize
                );
            });

        startStockListener();

    } catch (error) {
        console.error("Product details error:", error);
        container.innerHTML =
            "<h2>Unable to load product. Please refresh.</h2>";
    }
}

window.addEventListener("pagehide", () => {
    if (stockUnsubscribe) stockUnsubscribe();
});

loadProduct();
