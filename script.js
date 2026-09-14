/* =========================================================
   BARQ ONLINE STORE
   FINAL script.js
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

const productContainer =
    document.getElementById("productContainer");

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const cartButton =
    document.getElementById("cartButton");

const closeCartButton =
    document.getElementById("closeCartButton");

const cartBox =
    document.getElementById("cartBox");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");

const cartCount =
    document.getElementById("cartCount");

const checkoutButton =
    document.getElementById("checkoutButton");

const shopNowButton =
    document.getElementById("shopNowButton");

const dealsButton =
    document.getElementById("dealsButton");


/* =========================================================
   CART
   ========================================================= */

let cart = [];

try {

    const savedCart =
        JSON.parse(localStorage.getItem("barqCart"));

    if (Array.isArray(savedCart)) {
        cart = savedCart;
    }

} catch (error) {

    console.warn("Could not load saved cart.");

    cart = [];

}


/* =========================================================
   SAVE CART
   ========================================================= */

function saveCart() {

    try {

        localStorage.setItem(
            "barqCart",
            JSON.stringify(cart)
        );

    } catch (error) {

        console.warn("Could not save cart.");

    }

}


/* =========================================================
   FORMAT PRICE
   ========================================================= */

function formatPrice(price) {

    const number =
        Number(price);

    const safePrice =
        Number.isFinite(number)
            ? number
            : 0;

    return `${safePrice.toFixed(2)} SAR`;

}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts(productList = products) {

    if (!productContainer) {
        return;
    }

    productContainer.innerHTML = "";


    if (
        !Array.isArray(productList) ||
        productList.length === 0
    ) {

        productContainer.innerHTML = `
            <div class="no-products">
                <h3>No products found</h3>
                <p>Try another search.</p>
            </div>
        `;

        return;

    }


    productList.forEach(product => {

        const productCard =
            document.createElement("article");

        productCard.className =
            "product-card";


        const price =
            Number(product.price) || 0;

        const oldPrice =
            Number(product.oldPrice) || 0;


        productCard.innerHTML = `

            <div class="product-image-wrap">

                <img
                    src="${product.image || ""}"
                    alt="${product.name || "Product"}"
                    loading="lazy"
                >

                <button
                    class="favorite-button"
                    type="button"
                    data-id="${product.id}"
                    aria-label="Add ${product.name || "product"} to favorites"
                >
                    ♡
                </button>

            </div>


            <div class="product-info">

                <span class="product-category">
                    ${product.category || "Product"}
                </span>


                <h3>
                    ${product.name || "Unnamed Product"}
                </h3>


                <p class="product-description">
                    ${product.description || ""}
                </p>


                <div class="product-price">

                    <strong>
                        ${formatPrice(price)}
                    </strong>


                    <span>
                        ${formatPrice(oldPrice)}
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
   PRODUCT EVENTS
   ========================================================= */

function attachProductEvents() {


    const addButtons =
        document.querySelectorAll(
            ".add-cart-button"
        );


    addButtons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const productId =
                    Number(this.dataset.id);

                addToCart(productId);

            }
        );

    });


    const favoriteButtons =
        document.querySelectorAll(
            ".favorite-button"
        );


    favoriteButtons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                this.classList.toggle("active");

                this.textContent =
                    this.classList.contains("active")
                        ? "♥"
                        : "♡";

            }
        );

    });


    const viewButtons =
        document.querySelectorAll(
            ".view-button"
        );


    viewButtons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const productId =
                    Number(this.dataset.id);

                showProductDetails(productId);

            }
        );

    });

}


/* =========================================================
   PRODUCT DETAILS
   ========================================================= */

function showProductDetails(productId) {

    const product =
        products.find(
            item => item.id === productId
        );


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

    const product =
        products.find(
            item => item.id === productId
        );


    if (!product) {
        return;
    }


    const existingItem =
        cart.find(
            item => Number(item.id) === productId
        );


    if (existingItem) {

        existingItem.quantity =
            Number(existingItem.quantity) || 0;

        existingItem.quantity += 1;

        existingItem.price =
            Number(product.price) || 0;

    } else {

        cart.push({

            id: product.id,

            name: product.name,

            price: Number(product.price) || 0,

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

    cart =
        cart.filter(
            item => Number(item.id) !== productId
        );


    saveCart();

    updateCart();

}


/* =========================================================
   CHANGE QUANTITY
   ========================================================= */

function changeQuantity(productId, change) {

    const item =
        cart.find(
            product => Number(product.id) === productId
        );


    if (!item) {
        return;
    }


    item.quantity =
        Number(item.quantity) || 1;


    item.quantity += Number(change);


    if (item.quantity <= 0) {

        cart =
            cart.filter(
                product =>
                    Number(product.id) !== productId
            );

    }


    saveCart();

    updateCart();

}


/* =========================================================
   UPDATE CART
   ========================================================= */

function updateCart() {

    if (!cartItems) {
        return;
    }


    if (!cartTotal) {
        return;
    }


    if (!cartCount) {
        return;
    }


    cartItems.innerHTML = "";


    let total = 0;

    let itemCount = 0;


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <p class="empty-cart">
                Your cart is empty.
            </p>
        `;

    } else {


        cart.forEach(item => {


            const price =
                Number(item.price) || 0;


            const quantity =
                Number(item.quantity) || 1;


            const itemTotal =
                price * quantity;


            total += itemTotal;

            itemCount += quantity;


            const cartItem =
                document.createElement("div");


            cartItem.className =
                "cart-item";


            cartItem.innerHTML = `

                <img
                    src="${item.image || ""}"
                    alt="${item.name || "Product"}"
                >


                <div class="cart-item-info">

                    <h4>
                        ${item.name || "Product"}
                    </h4>


                    <strong>
                        ${formatPrice(price)}
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
                            ${quantity}
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


    cartTotal.textContent =
        formatPrice(total);


    cartCount.textContent =
        itemCount;


    attachCartEvents();

}


/* =========================================================
   CART EVENTS
   ========================================================= */

function attachCartEvents() {


    const quantityButtons =
        document.querySelectorAll(
            ".quantity-button"
        );


    quantityButtons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const productId =
                    Number(this.dataset.id);

                const change =
                    Number(this.dataset.change);

                changeQuantity(
                    productId,
                    change
                );

            }
        );

    });


    const removeButtons =
        document.querySelectorAll(
            ".remove-cart-button"
        );


    removeButtons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const productId =
                    Number(this.dataset.id);

                removeFromCart(productId);

            }
        );

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


    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    if (searchTerm === "") {

        renderProducts(products);

        return;

    }


    const filteredProducts =
        products.filter(product => {


            const name =
                String(product.name || "")
                    .toLowerCase();


            const category =
                String(product.category || "")
                    .toLowerCase();


            const brand =
                String(product.brand || "")
                    .toLowerCase();


            const description =
                String(product.description || "")
                    .toLowerCase();


            return (
                name.includes(searchTerm) ||
                category.includes(searchTerm) ||
                brand.includes(searchTerm) ||
                description.includes(searchTerm)
            );

        });


    renderProducts(filteredProducts);

}


/* =========================================================
   GO TO PRODUCTS
   ========================================================= */

function goToProducts() {

    const productsSection =
        document.getElementById("products");


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

    searchButton.addEventListener(
        "click",
        searchProducts
    );

}


/* =========================================================
   SEARCH WITH ENTER
   ========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                searchProducts();

            }

        }
    );

}


/* =========================================================
   CART BUTTON
   ========================================================= */

if (cartButton) {

    cartButton.addEventListener(
        "click",
        openCart
    );

}


/* =========================================================
   CLOSE CART BUTTON
   ========================================================= */

if (closeCartButton) {

    closeCartButton.addEventListener(
        "click",
        closeCart
    );

}


/* =========================================================
   SHOP NOW
   ========================================================= */

if (shopNowButton) {

    shopNowButton.addEventListener(
        "click",
        goToProducts
    );

}


/* =========================================================
   DEALS
   ========================================================= */

if (dealsButton) {

    dealsButton.addEventListener(
        "click",
        goToProducts
    );

}


/* =========================================================
   CHECKOUT
   ========================================================= */

if (checkoutButton) {

    checkoutButton.addEventListener(
        "click",
        function () {


            if (cart.length === 0) {

                alert(
                    "Your cart is empty."
                );

                return;

            }


            window.location.href =
                "checkout.html";

        }
    );

}


/* =========================================================
   CLEAN OLD / BROKEN CART DATA
   ========================================================= */

cart = cart
    .filter(item => item && item.id)
    .map(item => ({

        id: Number(item.id),

        name: item.name || "Product",

        price: Number(item.price) || 0,

        image: item.image || "",

        quantity: Number(item.quantity) || 1

    }));


saveCart();


/* =========================================================
   INITIALIZE STORE
   ========================================================= */

renderProducts();

updateCart();
