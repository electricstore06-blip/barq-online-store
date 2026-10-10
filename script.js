// ==========================================
// BARQ STORE MAIN SCRIPT
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

let cart = [];

try {
    const savedCart = JSON.parse(
        localStorage.getItem("barqCart") || "[]"
    );

    cart = Array.isArray(savedCart) ? savedCart : [];
} catch (error) {
    console.error("Could not read saved cart:", error);
    cart = [];
}

// Search state: keep search results separate from category products.
let currentCategory = null;
let searchRequest = 0;

// ==========================================
// HELPERS
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function getProductPrice(product, size = "") {
    const sizePrices = product.sizePrices || {};

    if (
        size &&
        Object.prototype.hasOwnProperty.call(sizePrices, size)
    ) {
        const specificPrice = Number(sizePrices[size]);

        if (Number.isFinite(specificPrice) && specificPrice >= 0) {
            return specificPrice;
        }
    }

    const regularPrice = Number(product.price);

    return Number.isFinite(regularPrice) && regularPrice >= 0
        ? regularPrice
        : 0;
}

function getProductCategory(product) {
    return String(product.category || "").trim().toLowerCase();
}

function getCategoryAliases(category) {
    const aliases = {
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

    return aliases[category] || [category];
}

// ==========================================
// LOAD PRODUCTS FROM FIREBASE
// ==========================================

async function loadProducts() {
    console.log("BARQ: Loading products...");

    const container = document.querySelector(
        "#products .product-container"
    );

    if (container) {
        container.innerHTML = "<p>Loading products...</p>";
    }

    try {
        const snapshot = await getDocs(
            collection(db, "products")
        );

        productsData = [];

        snapshot.forEach(documentSnapshot => {
            const product = {
                id: documentSnapshot.id,
                ...documentSnapshot.data()
            };

            // Keep inactive products out of the public store.
            if (product.active === false) {
                return;
            }

            productsData.push(product);
        });

        console.log("BARQ: Products loaded:", productsData.length);

        // Show all products initially.
        currentCategory = null;
        displayProducts(productsData);

        // Refresh any active search after loading.
        if (searchInput && searchInput.value.trim()) {
            renderSearchResults(searchInput.value);
        }
    } catch (error) {
        console.error("Firebase Products Error:", error);

        if (container) {
            container.innerHTML = `
                <p class="no-products">
                    Unable to load products. Please refresh the page.
                </p>
            `;
        }

        if (searchResultsContainer && searchInput?.value.trim()) {
            searchResultsContainer.innerHTML = `
                <p class="no-search-results">
                    Products could not be loaded. Please try again.
                </p>
            `;
        }
    }
}

// ==========================================
// DISPLAY PRODUCT CARDS
// ==========================================

function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product";

    const productArea = document.createElement("div");
    productArea.className = "product-click";
    productArea.tabIndex = 0;
    productArea.setAttribute("role", "link");
    productArea.setAttribute(
        "aria-label",
        `View ${product.name || "product"} details`
    );

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

    const basePrice = getProductPrice(product);
    const sizePrices = product.sizePrices || {};
    const availablePrices = Object.values(sizePrices)
        .map(Number)
        .filter(value => Number.isFinite(value) && value >= 0);

    if (availablePrices.length) {
        const lowestPrice = Math.min(basePrice, ...availablePrices);
        price.textContent = `From ${lowestPrice.toFixed(2)} SAR`;
    } else {
        price.textContent = `${basePrice.toFixed(2)} SAR`;
    }

    productArea.append(image, name, brand, price);

    function openProductDetails() {
        window.location.href =
            "./product-details.html?id=" +
            encodeURIComponent(product.id);
    }

    productArea.addEventListener("click", openProductDetails);

    productArea.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openProductDetails();
        }
    });

    const button = document.createElement("button");
    button.className = "add-btn";
    button.textContent = "View Options";

    // Products with color or size choices should be selected
    // on their detail page before being added to the cart.
    button.addEventListener("click", event => {
        event.stopPropagation();
        openProductDetails();
    });

    card.append(productArea, button);

    return card;
}

function displayProducts(products) {
    const container = document.querySelector(
        "#products .product-container"
    );

    if (!container) {
        console.error(
            'BARQ: Could not find "#products .product-container".'
        );
        return;
    }

    container.replaceChildren();

    if (!Array.isArray(products) || products.length === 0) {
        const message = document.createElement("p");
        message.className = "no-products";
        message.textContent = currentCategory
            ? "No products found in this category."
            : "No products available right now.";

        container.appendChild(message);
        return;
    }

    const fragment = document.createDocumentFragment();

    products.forEach(product => {
        fragment.appendChild(createProductCard(product));
    });

    container.appendChild(fragment);

    console.log("BARQ: Products displayed:", products.length);
}

// ==========================================
// SEARCH
// ==========================================

const searchInput = document.getElementById("searchInput");
const searchResultsSection = document.getElementById(
    "searchResultsSection"
);
const searchResultsContainer = document.getElementById(
    "searchResultsContainer"
);

function renderSearchResults(searchTerm) {
    const value = String(searchTerm || "").trim().toLowerCase();

    if (!value) {
        if (searchResultsSection) {
            searchResultsSection.hidden = true;
        }

        if (searchResultsContainer) {
            searchResultsContainer.replaceChildren();
        }

        const productsSection = document.getElementById("products");

        if (productsSection) {
            productsSection.style.display = "";
        }

        if (currentCategory) {
            displayProducts(
                productsData.filter(product =>
                    getCategoryAliases(currentCategory).includes(
                        getProductCategory(product)
                    )
                )
            );
        } else {
            displayProducts(productsData);
        }

        return;
    }

    const results = productsData.filter(product => {
        const name = String(product.name || "").toLowerCase();
        const brand = String(product.brand || "").toLowerCase();
        const category = getProductCategory(product);
        const description = String(
            product.description || ""
        ).toLowerCase();

        return (
            name.includes(value) ||
            brand.includes(value) ||
            category.includes(value) ||
            description.includes(value)
        );
    });

    // Use a separate search-results section if the HTML provides one.
    if (searchResultsSection && searchResultsContainer) {
        searchResultsSection.hidden = false;
        searchResultsContainer.replaceChildren();

        if (results.length === 0) {
            const message = document.createElement("p");
            message.className = "no-search-results";
            message.textContent =
                "No products found. Try another product name or brand.";

            searchResultsContainer.appendChild(message);
        } else {
            const fragment = document.createDocumentFragment();

            results.forEach(product => {
                fragment.appendChild(createProductCard(product));
            });

            searchResultsContainer.appendChild(fragment);
        }

        // IMPORTANT:
        // Do not call scrollIntoView while the user types.
        // That was making the interface jump.
        return;
    }

    // Fallback if no separate search-results section exists.
    displayProducts(results);
}

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const requestNumber = ++searchRequest;

        // Debounce rendering slightly so rapid typing feels smooth.
        window.clearTimeout(searchInput._barqSearchTimer);

        searchInput._barqSearchTimer = window.setTimeout(() => {
            if (requestNumber !== searchRequest) {
                return;
            }

            renderSearchResults(searchInput.value);
        }, 100);
    });
}

// ==========================================
// CATEGORY FILTERS
// ==========================================

document.querySelectorAll(".beauty-category-card").forEach(card => {
    card.addEventListener("click", event => {
        event.preventDefault();

        const category = String(
            card.dataset.category || ""
        ).trim().toLowerCase();

        if (!category) {
            return;
        }

        currentCategory = category;

        if (searchInput) {
            searchInput.value = "";
            window.clearTimeout(searchInput._barqSearchTimer);
        }

        if (searchResultsSection) {
            searchResultsSection.hidden = true;
        }

        if (searchResultsContainer) {
            searchResultsContainer.replaceChildren();
        }

        const productsSection = document.getElementById("products");

        if (!productsSection) {
            console.error("BARQ: Products section not found.");
            return;
        }

        productsSection.style.display = "";

        const aliases = getCategoryAliases(category);

        const filteredProducts = productsData.filter(product =>
            aliases.includes(getProductCategory(product))
        );

        const title = productsSection.querySelector("h2");

        if (title) {
            title.textContent =
                category.charAt(0).toUpperCase() +
                category.slice(1) +
                " Products";
        }

        displayProducts(filteredProducts);

        // Scroll only after the customer clicks a category,
        // never on every search keystroke.
        productsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});

// ==========================================
// CART SYSTEM
// ==========================================

function saveCart() {
    try {
        localStorage.setItem(
            "barqCart",
            JSON.stringify(cart)
        );
    } catch (error) {
        console.error("Could not save cart:", error);
        alert("Unable to save your cart. Please check browser storage.");
    }
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

    if (
        !Number.isFinite(selectedPrice) ||
        selectedPrice < 0
    ) {
        alert("Invalid product price.");
        return;
    }

    // Match the same product, color, size, and price.
    const existing = cart.find(item =>
        item.productId === id &&
        String(item.color || "") === String(color || "") &&
        String(item.size || "") === String(size || "") &&
        Number(item.price) === selectedPrice
    );

    if (existing) {
        existing.quantity = Math.max(
            1,
            Number(existing.quantity) || 1
        ) + 1;
    } else {
        cart.push({
            productId: id,
            name: name || "Product",
            price: selectedPrice,
            image: image || "",
            brand: brand || "BARQ",
            color: color || "",
            size: size || "",
            quantity: 1
        });
    }

    saveCart();
    updateCart();

    alert("Added to cart ✅");
}

// ==========================================
// CART DISPLAY
// ==========================================

function updateCart() {
    const itemsElement = document.getElementById("cartItems");
    const totalElement = document.getElementById("cartTotal");
    const countElement = document.getElementById("cartCount");

    let total = 0;
    let quantityTotal = 0;

    if (itemsElement) {
        itemsElement.replaceChildren();

        cart.forEach((item, index) => {
            const quantity = Math.max(
                0,
                Number(item.quantity) || 0
            );

            const price = Math.max(
                0,
                Number(item.price) || 0
            );

            total += price * quantity;
            quantityTotal += quantity;

            const row = document.createElement("div");
            row.className = "cart-item";

            const name = document.createElement("b");
            name.textContent = item.name || "Product";

            const optionDetails = document.createElement("p");

            const optionLabels = [];

            if (item.color) {
                optionLabels.push(`Color: ${item.color}`);
            }

            if (item.size) {
                optionLabels.push(`Size: ${item.size}`);
            }

            optionDetails.textContent = optionLabels.join(" | ");

            const priceElement = document.createElement("p");
            priceElement.textContent =
                `${price.toFixed(2)} SAR each`;

            const decreaseButton = document.createElement("button");
            decreaseButton.type = "button";
            decreaseButton.textContent = "-";
            decreaseButton.addEventListener("click", () => {
                decreaseQuantity(index);
            });

            const quantityElement = document.createElement("span");
            quantityElement.textContent = ` ${quantity} `;

            const increaseButton = document.createElement("button");
            increaseButton.type = "button";
            increaseButton.textContent = "+";
            increaseButton.addEventListener("click", () => {
                increaseQuantity(index);
            });

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", () => {
                removeCart(index);
            });

            row.append(name);

            if (optionLabels.length) {
                row.append(optionDetails);
            }

            row.append(
                priceElement,
                decreaseButton,
                quantityElement,
                increaseButton,
                removeButton
            );

            itemsElement.appendChild(row);
        });
    } else {
        // Keep totals correct even on pages without cart markup.
        cart.forEach(item => {
            total +=
                Math.max(0, Number(item.price) || 0) *
                Math.max(0, Number(item.quantity) || 0);

            quantityTotal += Math.max(
                0,
                Number(item.quantity) || 0
            );
        });
    }

    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }

    if (countElement) {
        countElement.textContent = String(quantityTotal);
    }
}

function increaseQuantity(index) {
    if (!cart[index]) {
        return;
    }

    cart[index].quantity =
        Math.max(1, Number(cart[index].quantity) || 1) + 1;

    saveCart();
    updateCart();
}

function decreaseQuantity(index) {
    if (!cart[index]) {
        return;
    }

    cart[index].quantity =
        (Number(cart[index].quantity) || 1) - 1;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart();
    updateCart();
}

function removeCart(index) {
    if (!Number.isInteger(index) || !cart[index]) {
        return;
    }

    cart.splice(index, 1);

    saveCart();
    updateCart();
}

// ==========================================
// CART OPEN / CLOSE
// ==========================================

function openCart() {
    const box = document.getElementById("cartBox");

    if (box) {
        box.style.display = "block";
    }

    updateCart();
}

function closeCart() {
    const box = document.getElementById("cartBox");

    if (box) {
        box.style.display = "none";
    }
}

// ==========================================
// CHECKOUT
// ==========================================

function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    window.location.href = "checkout.html";
}

// ==========================================
// MOBILE MENU
// ==========================================

function toggleMenu() {
    const menu = document.getElementById("mainNav");

    if (menu) {
        menu.classList.toggle("active");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("#mainNav a");

    links.forEach(link => {
        link.addEventListener("click", () => {
            const menu = document.getElementById("mainNav");

            if (menu) {
                menu.classList.remove("active");
            }
        });
    });

    const menuButton = document.getElementById("menuButton");

    if (menuButton) {
        menuButton.addEventListener("click", toggleMenu);
    }
});

// ==========================================
// EXPORT FUNCTIONS FOR HTML
// ==========================================

window.addToCart = addToCart;
window.updateCart = updateCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.checkout = checkout;
window.removeCart = removeCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.toggleMenu = toggleMenu;

// ==========================================
// START
// ==========================================

updateCart();
loadProducts();
