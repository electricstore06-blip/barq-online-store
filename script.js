
// ==========================================
// BARQ STORE MAIN SCRIPT
// Product display + Firebase + cart + language support
// Real-time product, stock and offers updates
// ==========================================

import { db } from "./firebase-config.js";

import {
    collection,
    onSnapshot
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
    console.error("BARQ: Could not read saved cart:", error);
    cart = [];
}

let currentCategory = null;
let searchRequest = 0;
let searchTimer = null;
let unsubscribeProducts = null;

const searchInput = document.getElementById("searchInput");

const searchResultsSection =
    document.getElementById("searchResultsSection");

const searchResultsContainer =
    document.getElementById("searchResultsContainer");

// ==========================================
// SEARCH FIELD PROTECTION
// ==========================================

function isEmailLikeSearch(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(value || "").trim()
    );
}

function clearSearchField() {
    if (!searchInput) return;

    searchInput.value = "";
    searchInput.setAttribute("autocomplete", "off");
    searchInput.setAttribute("autocapitalize", "off");
    searchInput.setAttribute("spellcheck", "false");
}

clearSearchField();

// ==========================================
// TRANSLATION HELPER
// ==========================================

function tr(key, fallback) {
    if (typeof window.barqTranslate === "function") {
        const result = window.barqTranslate(key);

        if (result && result !== key) {
            return result;
        }
    }

    return fallback;
}

// ==========================================
// PRODUCT HELPERS
// ==========================================

function getProductPrice(product, size = "") {
    const sizePrices = product.sizePrices || {};

    if (
        size &&
        Object.prototype.hasOwnProperty.call(sizePrices, size)
    ) {
        const specificPrice = Number(sizePrices[size]);

        if (
            Number.isFinite(specificPrice) &&
            specificPrice >= 0
        ) {
            return specificPrice;
        }
    }

    const regularPrice = Number(product.price);

    return Number.isFinite(regularPrice) && regularPrice >= 0
        ? regularPrice
        : 0;
}

// ==========================================
// OFFER HELPERS
// ==========================================

function getOfferDiscount(product) {
    const discount = Number(product.discountPercent);

    if (
        product.offerActive !== true ||
        !Number.isFinite(discount) ||
        discount < 1 ||
        discount > 99
    ) {
        return 0;
    }

    return discount;
}

function getLowestProductPrice(product) {
    const basePrice = getProductPrice(product);
    const sizePrices = product.sizePrices || {};

    const availablePrices = Object.values(sizePrices)
        .map(Number)
        .filter(value => Number.isFinite(value) && value >= 0);

    return availablePrices.length > 0
        ? Math.min(basePrice, ...availablePrices)
        : basePrice;
}

function renderOffers() {
    const offersSection = document.getElementById("offers");

    if (!offersSection) return;

    let offersContainer =
        offersSection.querySelector(".offers-products");

    if (!offersContainer) {
        offersContainer = document.createElement("div");
        offersContainer.className =
            "offers-products product-container";

        offersSection.appendChild(offersContainer);
    }

    const description = offersSection.querySelector("p");

    const activeOffers = productsData.filter(product => {
        const hasValidOffer = getOfferDiscount(product) > 0;
        const isAvailable = getStockStatus(product) !== "out";

        return hasValidOffer && isAvailable;
    });

    offersContainer.replaceChildren();

    if (activeOffers.length === 0) {
        if (description) {
            description.textContent =
                "No active offers right now. Please check back soon.";
        }

        const emptyMessage = document.createElement("p");
        emptyMessage.className = "no-products";
        emptyMessage.textContent =
            "There are no discounted products available right now.";

        offersContainer.appendChild(emptyMessage);
        return;
    }

    if (description) {
        description.textContent =
            "Enjoy these special prices on selected BARQ products.";
    }

    const fragment = document.createDocumentFragment();

    activeOffers.forEach(product => {
        const discount = getOfferDiscount(product);
        const originalPrice = getLowestProductPrice(product);

        const discountedPrice =
            originalPrice * (1 - discount / 100);

        const card = document.createElement("div");
        card.className = "product offer-product";

        const productArea = document.createElement("div");
        productArea.className = "product-click";
        productArea.tabIndex = 0;
        productArea.setAttribute("role", "link");

        productArea.setAttribute(
            "aria-label",
            `View ${product.name || "product"} offer details`
        );

        const badge = document.createElement("span");
        badge.className = "offer-badge";
        badge.textContent = `${discount}% OFF`;
        badge.style.display = "inline-block";
        badge.style.padding = "6px 10px";
        badge.style.marginBottom = "8px";
        badge.style.borderRadius = "6px";
        badge.style.backgroundColor = "#9b2638";
        badge.style.color = "#ffffff";
        badge.style.fontWeight = "700";

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

        const prices = document.createElement("div");
        prices.className = "offer-prices";
        prices.style.display = "flex";
        prices.style.alignItems = "center";
        prices.style.flexWrap = "wrap";
        prices.style.gap = "10px";
        prices.style.marginTop = "8px";

        const oldPrice = document.createElement("span");
        oldPrice.className = "offer-original-price";
        oldPrice.textContent =
            `${originalPrice.toFixed(2)} SAR`;

        oldPrice.style.textDecoration = "line-through";
        oldPrice.style.color = "#777777";

        const newPrice = document.createElement("strong");
        newPrice.className = "offer-discounted-price";
        newPrice.textContent =
            `${discountedPrice.toFixed(2)} SAR`;

        newPrice.style.color = "#9b2638";
        newPrice.style.fontWeight = "800";

        prices.append(oldPrice, newPrice);

        productArea.append(
            badge,
            image,
            name,
            brand,
            prices
        );

        function openOfferProduct() {
            window.location.href =
                "./product-details.html?id=" +
                encodeURIComponent(product.id);
        }

        productArea.addEventListener(
            "click",
            openOfferProduct
        );

        productArea.addEventListener("keydown", event => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                openOfferProduct();
            }
        });

        const button = document.createElement("button");
        button.type = "button";
        button.className = "add-btn";
        button.textContent =
            tr("viewOptions", "View Options");

        button.addEventListener("click", event => {
            event.stopPropagation();
            openOfferProduct();
        });

        card.append(productArea, button);
        fragment.appendChild(card);
    });

    offersContainer.appendChild(fragment);

    console.log(
        "BARQ: Active offers displayed:",
        activeOffers.length
    );
}

// ==========================================
// PRODUCT CATEGORY
// ==========================================

function getProductCategory(product) {
    return String(product.category || "")
        .trim()
        .toLowerCase();
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
// PRODUCT STOCK STATUS
// ==========================================

function getStockStatus(product) {
    if (
        product.stock === undefined ||
        product.stock === null ||
        product.stock === ""
    ) {
        return null;
    }

    const stock = Number(product.stock);

    if (!Number.isFinite(stock) || stock <= 0) {
        return "out";
    }

    return "in";
}

// ==========================================
// CREATE ONE PRODUCT CARD
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

    if (availablePrices.length > 0) {
        const lowestPrice = Math.min(
            basePrice,
            ...availablePrices
        );

        price.textContent =
            `${tr("from", "From")} ${lowestPrice.toFixed(2)} SAR`;

    } else {
        price.textContent =
            `${basePrice.toFixed(2)} SAR`;
    }

    productArea.append(image, name, brand, price);

    const stockStatus = getStockStatus(product);

    if (stockStatus !== null) {
        const stockLabel = document.createElement("p");
        stockLabel.className = "stock-status";

        if (stockStatus === "out") {
            stockLabel.textContent = "Out of Stock";
            stockLabel.style.color = "#c62828";
        } else {
            stockLabel.textContent = "In Stock";
            stockLabel.style.color = "#238636";
        }

        productArea.appendChild(stockLabel);
    }

    function openProductDetails() {
        window.location.href =
            "./product-details.html?id=" +
            encodeURIComponent(product.id);
    }

    productArea.addEventListener(
        "click",
        openProductDetails
    );

    productArea.addEventListener("keydown", event => {
        if (
            event.key === "Enter" ||
            event.key === " "
        ) {
            event.preventDefault();
            openProductDetails();
        }
    });

    const button = document.createElement("button");
    button.type = "button";
    button.className = "add-btn";
    button.textContent =
        tr("viewOptions", "View Options");

    button.addEventListener("click", event => {
        event.stopPropagation();
        openProductDetails();
    });

    card.append(productArea, button);

    return card;
}

// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(products) {
    const container = document.querySelector(
        "#products .product-container"
    );

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (
        !Array.isArray(products) ||
        products.length === 0
    ) {
        const message = document.createElement("p");
        message.className = "no-products";

        message.textContent = currentCategory
            ? tr(
                "noProductsInCategory",
                "No products found in this category."
            )
            : tr(
                "noProducts",
                "No products available right now."
            );

        container.appendChild(message);
        return;
    }

    const fragment = document.createDocumentFragment();

    products.forEach(product => {
        fragment.appendChild(
            createProductCard(product)
        );
    });

    container.appendChild(fragment);

    console.log(
        "BARQ: Products displayed:",
        products.length
    );
}

// ==========================================
// REAL-TIME PRODUCTS FROM FIREBASE
// ==========================================

function startProductsListener() {
    console.log(
        "BARQ: Starting real-time product listener..."
    );

    const container = document.querySelector(
        "#products .product-container"
    );

    if (container) {
        container.textContent =
            tr("loading", "Loading...");
    }

    if (unsubscribeProducts) {
        unsubscribeProducts();
        unsubscribeProducts = null;
    }

    unsubscribeProducts = onSnapshot(
        collection(db, "products"),

        snapshot => {
            productsData = [];

            snapshot.forEach(documentSnapshot => {
                const product = {
                    ...documentSnapshot.data(),
                    id: documentSnapshot.id
                };

                if (product.active === false) return;

                productsData.push(product);
            });

            console.log(
                "BARQ: Real-time products updated:",
                productsData.length
            );

            renderOffers();

            if (
                searchInput &&
                isEmailLikeSearch(searchInput.value)
            ) {
                clearSearchField();
            }

            if (
                searchInput &&
                searchInput.value.trim()
            ) {
                renderSearchResults(searchInput.value);

            } else if (currentCategory) {
                const aliases =
                    getCategoryAliases(currentCategory);

                displayProducts(
                    productsData.filter(product =>
                        aliases.includes(
                            getProductCategory(product)
                        )
                    )
                );

            } else {
                displayProducts(productsData);
            }
        },

        error => {
            console.error(
                "BARQ: Real-time products listener error:",
                error
            );

            if (container) {
                const message =
                    document.createElement("p");

                message.className = "no-products";

                message.textContent =
                    "Unable to update products. Please refresh the page.";

                container.replaceChildren(message);
            }

            if (
                searchResultsContainer &&
                searchInput?.value.trim()
            ) {
                const message =
                    document.createElement("p");

                message.className =
                    "no-search-results";

                message.textContent =
                    "Products could not be updated. Please try again.";

                searchResultsContainer.replaceChildren(
                    message
                );
            }
        }
    );
}

// ==========================================
// SEARCH
// ==========================================

function renderSearchResults(searchTerm) {
    const value = String(searchTerm || "")
        .trim()
        .toLowerCase();

    if (isEmailLikeSearch(value)) {
        clearSearchField();
        renderSearchResults("");
        return;
    }

    if (!value) {
        if (searchResultsSection) {
            searchResultsSection.hidden = true;
        }

        if (searchResultsContainer) {
            searchResultsContainer.replaceChildren();
        }

        const productsSection =
            document.getElementById("products");

        if (productsSection) {
            productsSection.style.display = "";
        }

        if (currentCategory) {
            const aliases =
                getCategoryAliases(currentCategory);

            displayProducts(
                productsData.filter(product =>
                    aliases.includes(
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
        const name =
            String(product.name || "").toLowerCase();

        const brand =
            String(product.brand || "").toLowerCase();

        const category =
            getProductCategory(product);

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

    if (
        searchResultsSection &&
        searchResultsContainer
    ) {
        searchResultsSection.hidden = false;
        searchResultsContainer.replaceChildren();

        if (results.length === 0) {
            const message =
                document.createElement("p");

            message.className =
                "no-search-results";

            message.textContent =
                "No products found. Try another product name or brand.";

            searchResultsContainer.appendChild(message);

        } else {
            const fragment =
                document.createDocumentFragment();

            results.forEach(product => {
                fragment.appendChild(
                    createProductCard(product)
                );
            });

            searchResultsContainer.appendChild(
                fragment
            );
        }

        return;
    }

    displayProducts(results);
}

// ==========================================
// SEARCH INPUT EVENTS
// ==========================================

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const requestNumber = ++searchRequest;

        window.clearTimeout(searchTimer);

        if (isEmailLikeSearch(searchInput.value)) {
            clearSearchField();
            renderSearchResults("");
            return;
        }

        searchTimer = window.setTimeout(() => {
            if (requestNumber !== searchRequest) return;

            renderSearchResults(searchInput.value);
        }, 100);
    });

    window.addEventListener("load", () => {
        if (isEmailLikeSearch(searchInput.value)) {
            clearSearchField();
        }

        renderSearchResults(searchInput.value);
    });

    window.addEventListener("pageshow", () => {
        if (isEmailLikeSearch(searchInput.value)) {
            clearSearchField();
            renderSearchResults("");
        }
    });
}

// ==========================================
// CATEGORY FILTERS
// ==========================================

document.querySelectorAll(
    ".beauty-category-card"
).forEach(card => {
    card.addEventListener("click", event => {
        event.preventDefault();

        const category = String(
            card.dataset.category || ""
        )
            .trim()
            .toLowerCase();

        if (!category) return;

        currentCategory = category;

        if (searchInput) {
            clearSearchField();
            window.clearTimeout(searchTimer);
            searchRequest++;
        }

        if (searchResultsSection) {
            searchResultsSection.hidden = true;
        }

        if (searchResultsContainer) {
            searchResultsContainer.replaceChildren();
        }

        const productsSection =
            document.getElementById("products");

        if (!productsSection) {
            console.error(
                "BARQ: Products section not found."
            );
            return;
        }

        productsSection.style.display = "";

        const aliases =
            getCategoryAliases(category);

        const filteredProducts =
            productsData.filter(product =>
                aliases.includes(
                    getProductCategory(product)
                )
            );

        const title =
            productsSection.querySelector("h2");

        if (title) {
            title.textContent =
                category.charAt(0).toUpperCase() +
                category.slice(1) +
                " Products";
        }

        displayProducts(filteredProducts);

        productsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});

// ==========================================
// CART STORAGE
// ==========================================

function saveCart() {
    try {
        localStorage.setItem(
            "barqCart",
            JSON.stringify(cart)
        );

    } catch (error) {
        console.error(
            "BARQ: Could not save cart:",
            error
        );

        alert(
            "Unable to save your cart. Please check browser storage."
        );
    }
}

// ==========================================
// ADD TO CART
// ==========================================

function addToCart(
    id,
    name,
    price,
    image,
    brand,
    color = "",
    size = "",
    originalPrice = price,
    discountPercent = 0
) {
    const selectedPrice = Number(price);
    const regularPrice = Number(originalPrice);
    const discount = Number(discountPercent);

    if (
        !Number.isFinite(selectedPrice) ||
        selectedPrice < 0
    ) {
        alert("Invalid product price.");
        return;
    }

    const safeOriginalPrice =
        Number.isFinite(regularPrice) &&
        regularPrice >= selectedPrice
            ? regularPrice
            : selectedPrice;

    const safeDiscount =
        Number.isFinite(discount) &&
        discount >= 1 &&
        discount <= 99 &&
        safeOriginalPrice > selectedPrice
            ? discount
            : 0;

    const existing = cart.find(item =>
        item.productId === id &&
        String(item.color || "") === String(color || "") &&
        String(item.size || "") === String(size || "") &&
        Number(item.price) === selectedPrice
    );

    if (existing) {
        existing.quantity =
            Math.max(
                1,
                Number(existing.quantity) || 1
            ) + 1;

        // Refresh offer information when the same item is added again.
        existing.originalPrice = safeOriginalPrice;
        existing.discountPercent = safeDiscount;

    } else {
        cart.push({
            productId: id,
            name: name || "Product",
            price: selectedPrice,
            originalPrice: safeOriginalPrice,
            discountPercent: safeDiscount,
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
// CREATE CART BUTTON
// ==========================================

function createCartButton(text, className, callback) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent = text;

    button.addEventListener("click", callback);

    return button;
}

// ==========================================
// UPDATE CART DISPLAY
// ==========================================

function updateCart() {
    const itemsElement =
        document.getElementById("cartItems");

    const totalElement =
        document.getElementById("cartTotal");

    const countElement =
        document.getElementById("cartCount");

    let total = 0;
    let quantityTotal = 0;

    if (itemsElement) {
        itemsElement.replaceChildren();
    }

    cart.forEach((item, index) => {
        const quantity = Math.max(
            0,
            Number(item.quantity) || 0
        );

        const price = Math.max(
            0,
            Number(item.price) || 0
        );

        const originalPriceValue = Number(item.originalPrice);

        const originalPrice =
            Number.isFinite(originalPriceValue) &&
            originalPriceValue > price
                ? originalPriceValue
                : price;

        const discount = Number(item.discountPercent);

        const hasDiscount =
            originalPrice > price &&
            Number.isFinite(discount) &&
            discount >= 1 &&
            discount <= 99;

        const lineTotal = price * quantity;
        const savings = (originalPrice - price) * quantity;

        total += lineTotal;
        quantityTotal += quantity;

        if (!itemsElement) return;

        const row = document.createElement("div");
        row.className = "cart-item cart-item-card";

        // Product image
        const image = document.createElement("img");
        image.className = "cart-item-image";
        image.src = item.image || "";
        image.alt = item.name || "Product";

        image.onerror = function () {
            this.style.display = "none";
        };

        // Product information
        const info = document.createElement("div");
        info.className = "cart-item-info";

        const name = document.createElement("h4");
        name.className = "cart-item-name";
        name.textContent = item.name || "Product";

        const brand = document.createElement("p");
        brand.className = "cart-item-brand";
        brand.textContent = item.brand || "BARQ";

        const optionDetails = document.createElement("p");
        optionDetails.className = "cart-item-options";

        const optionLabels = [];

        if (item.color) {
            optionLabels.push(`Color: ${item.color}`);
        }

        if (item.size) {
            optionLabels.push(`Size: ${item.size}`);
        }

        optionDetails.textContent =
            optionLabels.join(" | ");

        info.append(name, brand);

        if (optionLabels.length > 0) {
            info.appendChild(optionDetails);
        }

        // Price information
        const pricing = document.createElement("div");
        pricing.className = "cart-item-pricing";

        if (hasDiscount) {
            const badge = document.createElement("span");
            badge.className = "cart-discount-badge";
            badge.textContent = `${discount}% OFF`;

            const oldPrice = document.createElement("span");
            oldPrice.className = "cart-original-price";
            oldPrice.textContent =
                `${originalPrice.toFixed(2)} SAR`;

            const currentPrice = document.createElement("strong");
            currentPrice.className = "cart-discounted-price";
            currentPrice.textContent =
                `${price.toFixed(2)} SAR each`;

            const saved = document.createElement("span");
            saved.className = "cart-savings";
            saved.textContent =
                `You save ${savings.toFixed(2)} SAR`;

            pricing.append(
                badge,
                oldPrice,
                currentPrice,
                saved
            );

        } else {
            const currentPrice = document.createElement("strong");
            currentPrice.className = "cart-regular-price";
            currentPrice.textContent =
                `${price.toFixed(2)} SAR each`;

            pricing.appendChild(currentPrice);
        }

        // Quantity controls
        const controls = document.createElement("div");
        controls.className = "cart-quantity-controls";

        const decreaseButton = createCartButton(
            "−",
            "cart-quantity-btn",
            () => decreaseQuantity(index)
        );

        const quantityElement = document.createElement("span");
        quantityElement.className = "cart-quantity";
        quantityElement.textContent = String(quantity);

        const increaseButton = createCartButton(
            "+",
            "cart-quantity-btn",
            () => increaseQuantity(index)
        );

        controls.append(
            decreaseButton,
            quantityElement,
            increaseButton
        );

        // Item total
        const itemTotal = document.createElement("strong");
        itemTotal.className = "cart-item-total";
        itemTotal.textContent =
            `${lineTotal.toFixed(2)} SAR`;

        // Remove button
        const removeButton = createCartButton(
            tr("remove", "Remove"),
            "cart-remove-btn",
            () => removeCart(index)
        );

        const bottom = document.createElement("div");
        bottom.className = "cart-item-bottom";

        bottom.append(
            controls,
            itemTotal,
            removeButton
        );

        const details = document.createElement("div");
        details.className = "cart-item-details";

        details.append(info, pricing, bottom);

        row.append(image, details);

        itemsElement.appendChild(row);
    });

    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }

    if (countElement) {
        countElement.textContent =
            String(quantityTotal);
    }
}

// ==========================================
// CART QUANTITY FUNCTIONS
// ==========================================

function increaseQuantity(index) {
    if (!cart[index]) return;

    cart[index].quantity =
        Math.max(
            1,
            Number(cart[index].quantity) || 1
        ) + 1;

    saveCart();
    updateCart();
}

function decreaseQuantity(index) {
    if (!cart[index]) return;

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
// OPEN / CLOSE CART
// ==========================================

function openCart() {
    const box =
        document.getElementById("cartBox");

    if (box) {
        box.style.display = "block";
    }

    updateCart();
}

function closeCart() {
    const box =
        document.getElementById("cartBox");

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
    const menu =
        document.getElementById("mainNav");

    if (menu) {
        menu.classList.toggle("active");
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        document.querySelectorAll(
            "#mainNav a"
        ).forEach(link => {
            link.addEventListener("click", () => {
                const menu =
                    document.getElementById("mainNav");

                if (menu) {
                    menu.classList.remove("active");
                }
            });
        });

        const menuButton =
            document.getElementById("menuButton");

        if (menuButton) {
            menuButton.addEventListener(
                "click",
                toggleMenu
            );
        }
    }
);

// ==========================================
// LANGUAGE CHANGE
// ==========================================

document.addEventListener(
    "barq:languageChanged",
    () => {
        if (
            searchInput &&
            isEmailLikeSearch(searchInput.value)
        ) {
            clearSearchField();
        }

        if (
            searchInput &&
            searchInput.value.trim()
        ) {
            renderSearchResults(searchInput.value);

        } else if (currentCategory) {
            const aliases =
                getCategoryAliases(currentCategory);

            displayProducts(
                productsData.filter(product =>
                    aliases.includes(
                        getProductCategory(product)
                    )
                )
            );

        } else {
            displayProducts(productsData);
        }

        renderOffers();
        updateCart();
    }
);

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
startProductsListener();
