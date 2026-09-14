/* =========================================================
   BARQ ONLINE STORE
   script.js
   ========================================================= */


/* =========================================================
   PRODUCT DATA
   ========================================================= */

const products = [
    {
        id: 1,
        name: "Wireless Headphones",
        category: "Audio",
        brand: "BARQ",
        price: 149,
        oldPrice: 199,
        image: "https://placehold.co/600x600?text=Wireless+Headphones",
        description: "High-quality wireless headphones with clear sound and comfortable design."
    },
    {
        id: 2,
        name: "Smart Watch",
        category: "Wearables",
        brand: "BARQ",
        price: 229,
        oldPrice: 299,
        image: "https://placehold.co/600x600?text=Smart+Watch",
        description: "Modern smart watch with fitness tracking and smart notifications."
    },
    {
        id: 3,
        name: "Bluetooth Speaker",
        category: "Audio",
        brand: "BARQ",
        price: 119,
        oldPrice: 159,
        image: "https://placehold.co/600x600?text=Bluetooth+Speaker",
        description: "Portable Bluetooth speaker with powerful sound."
    },
    {
        id: 4,
        name: "Wireless Charger",
        category: "Accessories",
        brand: "BARQ",
        price: 79,
        oldPrice: 99,
        image: "https://placehold.co/600x600?text=Wireless+Charger",
        description: "Fast and convenient wireless charging for compatible devices."
    },
    {
        id: 5,
        name: "Power Bank",
        category: "Accessories",
        brand: "BARQ",
        price: 99,
        oldPrice: 129,
        image: "https://placehold.co/600x600?text=Power+Bank",
        description: "Reliable portable power bank for charging on the go."
    },
    {
        id: 6,
        name: "Gaming Mouse",
        category: "Gaming",
        brand: "BARQ",
        price: 89,
        oldPrice: 119,
        image: "https://placehold.co/600x600?text=Gaming+Mouse",
        description: "Responsive gaming mouse designed for precision and comfort."
    },
    {
        id: 7,
        name: "Mechanical Keyboard",
        category: "Gaming",
        brand: "BARQ",
        price: 199,
        oldPrice: 249,
        image: "https://placehold.co/600x600?text=Mechanical+Keyboard",
        description: "Mechanical keyboard with a premium typing experience."
    },
    {
        id: 8,
        name: "USB-C Cable",
        category: "Accessories",
        brand: "BARQ",
        price: 39,
        oldPrice: 49,
        image: "https://placehold.co/600x600?text=USB-C+Cable",
        description: "Durable USB-C cable for charging and data transfer."
    }
];


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const productContainer = document.getElementById("productContainer");

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const cartButton = document.getElementById("cartButton");
const closeCartButton = document.getElementById("closeCartButton");
const cartBox = document.getElementById("cartBox");

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");

const checkoutButton = document.getElementById("checkoutButton");

const shopNowButton = document.getElementById("shopNowButton");
const dealsButton = document.getElementById("dealsButton");


/* =========================================================
   CART
   ========================================================= */

let cart = JSON.parse(localStorage.getItem("barqCart")) || [];


/* =========================================================
   SAVE CART
   ========================================================= */

function saveCart() {
    localStorage.setItem("barqCart", JSON.stringify(cart));
}


/* =========================================================
   FORMAT PRICE
   ========================================================= */

function formatPrice(price) {
    return `${price.toFixed(2)} SAR`;
}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts(productList = products) {

    if (!productContainer) {
        return;
    }

    productContainer.innerHTML = "";

    if (productList.length === 0) {

        productContainer.innerHTML = `
            <div class="no-products">
                <h3>No products found</h3>
                <p>Try another search.</p>
            </div>
        `;

        return;
    }

    productList.forEach(product => {

        const productCard = document.createElement("article");

        productCard.className = "product-card";

        productCard.innerHTML = `
            <div class="product-image-wrap">

                <img
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy"
                >

                <button
                    class="favorite-button"
                    type="button"
                    data-id="${product.id}"
                    aria-label="Add ${product.name} to favorites"
                >
                    ♡
                </button>

            </div>

            <div class="product-info">

                <span class="product-category">
                    ${product.category}
                </span>

                <h3>${product.name}</h3>

                <p class="product-description">
                    ${product.description}
                </p>

                <div class="product-price">

                    <strong>
                        ${formatPrice(product.price)}
                    </strong>

                    <span>
                        ${formatPrice(product.oldPrice)}
                    </span>

                </div>

                <div class="product-actions">

                    <button
                        class="view-button"
                        type="button"
                        data-id="${product.id}"
                    >
                        View
                    </button>

                    <button
                        class="add-cart-button"
                        type="button"
                        data-id="${product.id}"
                    >
                        Add to Cart
                    </button>

                </div>

            </div>
        `;

        productContainer.appendChild(productCard);
    });

    attachProductEvents();
}


/* =========================================================
   PRODUCT BUTTON EVENTS
   ========================================================= */

function attachProductEvents() {

    const addButtons = document.querySelectorAll(".add-cart-button");

    addButtons.forEach(button => {

        button.addEventListener("click", () => {

            const productId = Number(button.dataset.id);

            addToCart(productId);

        });

    });


    const favoriteButtons = document.querySelectorAll(".favorite-button");

    favoriteButtons.forEach(button => {

        button.addEventListener("click", () => {

            button.classList.toggle("active");

            if (button.classList.contains("active")) {
                button.textContent = "♥";
            } else {
                button.textContent = "♡";
            }

        });

    });


    const viewButtons = document.querySelectorAll(".view-button");

    viewButtons.forEach(button => {

        button.addEventListener("click", () => {

            const productId = Number(button.dataset.id);

            showProductDetails(productId);

        });

    });
}


/* =========================================================
   PRODUCT DETAILS
   ========================================================= */

function showProductDetails(productId) {

    const product = products.find(item => item.id === productId);

    if (!product) {
        return;
    }

    alert(
        `${product.name}\n\n` +
        `${product.description}\n\n` +
        `Price: ${formatPrice(product.price)}`
    );
}


/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart(productId) {

    const product = products.find(item => item.id === productId);

    if (!product) {
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {

        existingItem.quantity += 1;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });

    }

    saveCart();

    updateCart();

    openCart();

}


/* =========================================================
   REMOVE FROM CART
   ========================================================= */

function removeFromCart(productId) {

    cart = cart.filter(item => item.id !== productId);

    saveCart();

    updateCart();
}


/* =========================================================
   CHANGE CART QUANTITY
   ========================================================= */

function changeQuantity(productId, change) {

    const item = cart.find(product => product.id === productId);

    if (!item) {
        return;
    }

    item.quantity += change;

    if (item.quantity <= 0) {

        cart = cart.filter(product => product.id !== productId);

    }

    saveCart();

    updateCart();
}


/* =========================================================
   UPDATE CART
   ========================================================= */

function updateCart() {

    if (!cartItems || !cartTotal || !cartCount) {
        return;
    }

    cartItems.innerHTML = "";

    let total = 0;
    let itemCount = 0;


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="empty-cart">
                <p>Your cart is empty.</p>
            </div>
        `;

    } else {

        cart.forEach(item => {

            const itemTotal = item.price * item.quantity;

            total += itemTotal;

            itemCount += item.quantity;

            const cartItem = document.createElement("div");

            cartItem.className = "cart-item";

            cartItem.innerHTML = `
                <img
                    src="${item.image}"
                    alt="${item.name}"
                >

                <div class="cart-item-info">

                    <h4>${item.name}</h4>

                    <strong>
                        ${formatPrice(item.price)}
                    </strong>

                    <div class="quantity-controls">

                        <button
                            type="button"
                            class="quantity-button"
                            data-id="${item.id}"
                            data-change="-1"
                        >
                            −
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            type="button"
                            class="quantity-button"
                            data-id="${item.id}"
                            data-change="1"
                        >
                            +
                        </button>

                    </div>

                    <button
                        type="button"
                        class="remove-cart-button"
                        data-id="${item.id}"
                    >
                        Remove
                    </button>

                </div>
            `;

            cartItems.appendChild(cartItem);

        });
    }


    cartTotal.textContent = formatPrice(total);

    cartCount.textContent = itemCount;


    attachCartEvents();
}


/* =========================================================
   CART EVENTS
   ========================================================= */

function attachCartEvents() {

    const quantityButtons = document.querySelectorAll(".quantity-button");

    quantityButtons.forEach(button => {

        button.addEventListener("click", () => {

            const productId = Number(button.dataset.id);

            const change = Number(button.dataset.change);

            changeQuantity(productId, change);

        });

    });


    const removeButtons = document.querySelectorAll(".remove-cart-button");

    removeButtons.forEach(button => {

        button.addEventListener("click", () => {

            const productId = Number(button.dataset.id);

            removeFromCart(productId);

        });

    });
}


/* =========================================================
   OPEN CART
   ========================================================= */

function openCart() {

    if (!cartBox) {
        return;
    }

    cartBox.classList.add("active");

    document.body.classList.add("cart-open");
}


/* =========================================================
   CLOSE CART
   ========================================================= */

function closeCart() {

    if (!cartBox) {
        return;
    }

    cartBox.classList.remove("active");

    document.body.classList.remove("cart-open");
}


/* =========================================================
   SEARCH PRODUCTS
   ========================================================= */

function searchProducts() {

    if (!searchInput) {
        return;
    }

    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();


    if (searchTerm === "") {

        renderProducts(products);

        return;
    }


    const filteredProducts = products.filter(product => {

        return (
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );

    });


    renderProducts(filteredProducts);

}


/* =========================================================
   SCROLL TO PRODUCTS
   ========================================================= */

function goToProducts() {

    const productsSection = document.getElementById("products");

    if (!productsSection) {
        return;
    }

    productsSection.scrollIntoView({
        behavior: "smooth"
    });

}


/* =========================================================
   SEARCH BUTTON
   ========================================================= */

if (searchButton) {

    searchButton.addEventListener("click", searchProducts);

}


/* =========================================================
   SEARCH WITH ENTER
   ========================================================= */

if (searchInput) {

    searchInput.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            event.preventDefault();

            searchProducts();

        }

    });

}


/* =========================================================
   CART BUTTON
   ========================================================= */

if (cartButton) {

    cartButton.addEventListener("click", openCart);

}


/* =========================================================
   CLOSE CART BUTTON
   ========================================================= */

if (closeCartButton) {

    closeCartButton.addEventListener("click", closeCart);

}


/* =========================================================
   SHOP NOW BUTTON
   ========================================================= */

if (shopNowButton) {

    shopNowButton.addEventListener("click", goToProducts);

}


/* =========================================================
   DEALS BUTTON
   ========================================================= */

if (dealsButton) {

    dealsButton.addEventListener("click", goToProducts);

}


/* =========================================================
   CHECKOUT
   ========================================================= */

if (checkoutButton) {

    checkoutButton.addEventListener("click", () => {

        if (cart.length === 0) {

            alert("Your cart is empty.");

            return;
        }

        window.location.href = "checkout.html";

    });

}


/* =========================================================
   INITIALIZE STORE
   ========================================================= */

renderProducts();

updateCart();
