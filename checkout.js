
 // ==========================================
 // BARQ CHECKOUT — SECURE ORDER CREATION
 // Uses Firebase Cloud Function createOrder
 // ==========================================

import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";


// ==========================================
// FIREBASE CLOUD FUNCTION
// ==========================================

const functions = getFunctions(getApp());
const createOrderFunction = httpsCallable(functions, "createOrder");


// ==========================================
// CART
// ==========================================

function readCart() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("barqCart") || "[]"
        );

        return Array.isArray(saved) ? saved : [];

    } catch (error) {
        console.error("Could not read BARQ cart:", error);
        return [];
    }
}

let cart = readCart();


// ==========================================
// PAGE ELEMENTS
// ==========================================

const orderItems = document.getElementById("order-items");
const subtotalElement = document.getElementById("subtotal");
const deliveryElement = document.getElementById("delivery");
const totalElement = document.getElementById("total");

const placeOrderButton =
    document.getElementById("place-order-btn");

const checkoutMessage =
    document.getElementById("checkout-message");

const locationButton =
    document.getElementById("get-location-btn");

const locationStatus =
    document.getElementById("location-status");

const latitudeInput =
    document.getElementById("latitude");

const longitudeInput =
    document.getElementById("longitude");

const accuracyInput =
    document.getElementById("location-accuracy");


// ==========================================
// CUSTOMER AUTHENTICATION
// ==========================================

let currentUser = null;
let authReady = false;
let submittingOrder = false;

onAuthStateChanged(
    auth,
    user => {
        currentUser = user;
        authReady = true;

        console.log(
            user
                ? "BARQ Checkout: Customer authenticated."
                : "BARQ Checkout: Customer not signed in."
        );
    },
    error => {
        console.error("Authentication check failed:", error);

        authReady = true;
        currentUser = null;

        showMessage(
            "Unable to verify your account. Please refresh the page."
        );
    }
);


// ==========================================
// MESSAGES
// ==========================================

function showMessage(message) {
    if (checkoutMessage) {
        checkoutMessage.textContent = message;
    }
}

function formatSAR(amount) {
    return `SAR ${Number(amount).toFixed(2)}`;
}


// ==========================================
// CART VALIDATION & TOTALS
// ==========================================

function validateCart(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return "Your cart is empty.";
    }

    for (const item of items) {
        if (!item || typeof item !== "object") {
            return "Your cart contains an invalid item.";
        }

        if (
            typeof item.productId !== "string" ||
            !item.productId.trim()
        ) {
            return "A product is missing its product ID. Please update your cart.";
        }

        const price = Number(item.price);
        const quantity = Number(item.quantity);

        if (
            !Number.isFinite(price) ||
            price < 0 ||
            !Number.isSafeInteger(Math.round(price * 100))
        ) {
            return "A product has an invalid price. Please update your cart.";
        }

        if (
            !Number.isSafeInteger(quantity) ||
            quantity < 1 ||
            quantity > 999
        ) {
            return "A product has an invalid quantity. Please update your cart.";
        }
    }

    return "";
}

function calculateTotals(items) {
    const subtotalHalalas = items.reduce((sum, item) => {
        const priceHalalas = Math.round(
            Number(item.price) * 100
        );

        return sum + priceHalalas * Number(item.quantity);
    }, 0);

    const deliveryHalalas = subtotalHalalas > 0 ? 1500 : 0;

    return {
        subtotal: subtotalHalalas / 100,
        delivery: deliveryHalalas / 100,
        total: (subtotalHalalas + deliveryHalalas) / 100
    };
}


// ==========================================
// DISPLAY ORDER
// ==========================================

function displayOrder() {
    if (!orderItems) return;

    orderItems.replaceChildren();

    cart = readCart();

    const cartError = validateCart(cart);

    if (cartError) {
        orderItems.textContent = cartError;

        updateTotals({
            subtotal: 0,
            delivery: 0,
            total: 0
        });

        if (placeOrderButton) {
            placeOrderButton.disabled = true;
        }

        return;
    }

    if (placeOrderButton) {
        placeOrderButton.disabled = false;
    }

    const totals = calculateTotals(cart);

    cart.forEach(item => {
        const itemTotal =
            Math.round(Number(item.price) * 100) *
            Number(item.quantity) / 100;

        const itemDiv = document.createElement("div");
        itemDiv.className = "order-item";

        const details = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = String(item.name || "Product");

        const quantity = document.createElement("p");
        quantity.textContent = `Quantity: ${item.quantity}`;

        if (item.size) {
            const size = document.createElement("p");
            size.textContent = `Size: ${String(item.size)}`;
            details.appendChild(size);
        }

        if (item.color) {
            const color = document.createElement("p");
            color.textContent = `Color: ${String(item.color)}`;
            details.appendChild(color);
        }

        details.prepend(name);
        details.appendChild(quantity);

        const price = document.createElement("div");
        price.textContent = formatSAR(itemTotal);

        itemDiv.append(details, price);
        orderItems.appendChild(itemDiv);
    });

    updateTotals(totals);
}

function updateTotals(totals) {
    if (subtotalElement) {
        subtotalElement.textContent = formatSAR(totals.subtotal);
    }

    if (deliveryElement) {
        deliveryElement.textContent = formatSAR(totals.delivery);
    }

    if (totalElement) {
        totalElement.textContent = formatSAR(totals.total);
    }
}


// ==========================================
// OPTIONAL CUSTOMER LOCATION
// ==========================================

if (locationButton) {
    locationButton.addEventListener("click", () => {
        if (!navigator.geolocation) {
            if (locationStatus) {
                locationStatus.textContent =
                    "Location is not supported. Enter your address instead.";
            }

            return;
        }

        locationButton.disabled = true;

        if (locationStatus) {
            locationStatus.textContent = "Getting your location...";
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                if (latitudeInput) {
                    latitudeInput.value =
                        String(position.coords.latitude);
                }

                if (longitudeInput) {
                    longitudeInput.value =
                        String(position.coords.longitude);
                }

                if (accuracyInput) {
                    accuracyInput.value =
                        String(position.coords.accuracy);
                }

                if (locationStatus) {
                    locationStatus.textContent =
                        "✓ Location selected successfully";
                }

                locationButton.textContent =
                    "📍 Location Selected";

                locationButton.disabled = false;
            },
            error => {
                console.error("Location error:", error);

                if (locationStatus) {
                    locationStatus.textContent =
                        "Unable to get your location. You can enter your address instead.";
                }

                locationButton.disabled = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });
}


// ==========================================
// CUSTOMER INFORMATION VALIDATION
// ==========================================

function getCustomerDetails() {
    const fullName =
        document.getElementById("full-name")?.value.trim() || "";

    const phone =
        document.getElementById("phone")?.value.trim() || "";

    const email =
        document.getElementById("email")?.value.trim() || "";

    const address =
        document.getElementById("address")?.value.trim() || "";

    const paymentElement =
        document.querySelector('input[name="payment"]:checked');

    if (fullName.length < 2 || fullName.length > 100) {
        throw new Error("Please enter your full name.");
    }

    if (!/^05\d{8}$/.test(phone)) {
        throw new Error(
            "Please enter a valid Saudi phone number, such as 05xxxxxxxx."
        );
    }

    if (
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        throw new Error("Please enter a valid email address.");
    }

    if (address.length < 5 || address.length > 1000) {
        throw new Error("Please enter your complete delivery address.");
    }

    if (!paymentElement) {
        throw new Error("Please select a payment method.");
    }

    return {
        fullName,
        phone,
        email,
        address,
        paymentMethod: paymentElement.value
    };
}


// ==========================================
// PLACE ORDER — SECURE CLOUD FUNCTION
// ==========================================

if (placeOrderButton) {
    placeOrderButton.addEventListener("click", async () => {

        if (submittingOrder) return;

        showMessage("");

        if (!authReady) {
            showMessage(
                "Checking your account. Please try again shortly."
            );
            return;
        }

        if (!currentUser) {
            showMessage(
                "Please sign in to your BARQ account before placing your order."
            );
            return;
        }

        cart = readCart();

        const cartError = validateCart(cart);

        if (cartError) {
            showMessage(cartError);
            displayOrder();
            return;
        }

        let customer;

        try {
            customer = getCustomerDetails();
        } catch (error) {
            showMessage(error.message);
            return;
        }

        submittingOrder = true;
        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Processing Order...";

        try {
            const latitude =
                latitudeInput?.value
                    ? Number(latitudeInput.value)
                    : null;

            const longitude =
                longitudeInput?.value
                    ? Number(longitudeInput.value)
                    : null;

            const locationAccuracy =
                accuracyInput?.value
                    ? Number(accuracyInput.value)
                    : 0;

            // Send only customer information and selected products.
            // The server retrieves trusted product prices and stock.
            const requestData = {
                customer: {
                    fullName: customer.fullName,
                    phone: customer.phone,
                    email: customer.email,
                    address: customer.address,
                    paymentMethod: customer.paymentMethod
                },

                latitude,
                longitude,
                locationAccuracy,

                items: cart.map(item => ({
                    productId: String(item.productId),
                    quantity: Number(item.quantity),
                    color: String(item.color || ""),
                    size: String(item.size || "")
                }))
            };

            // Call the secure Firebase function.
            const response = await createOrderFunction(requestData);

            const result = response.data;

            if (
                !result ||
                result.success !== true ||
                !result.orderId ||
                !result.order
            ) {
                throw new Error(
                    "The server did not confirm your order."
                );
            }

            // Use the server-confirmed order and totals.
            const orderData = result.order;
            const totals = result.totals;

            // ==========================================
            // SAVE ORDER INFORMATION FOR SUCCESS PAGE
            // ==========================================

            localStorage.setItem(
                "barqOrder",
                JSON.stringify({
                    id: result.orderId,
                    ...orderData,
                    deliveryCode: result.deliveryCode
                })
            );

            localStorage.setItem(
                "barqOrderTotal",
                Number(totals.total).toFixed(2)
            );

            localStorage.setItem(
                "barqOrderId",
                result.orderId
            );

            localStorage.setItem(
                "barqCustomerEmail",
                customer.email
            );

            localStorage.setItem(
                "barqCustomerName",
                customer.fullName
            );

            // Clear cart only after server confirmation.
            localStorage.removeItem("barqCart");

            window.location.href = "order-success.html";

        } catch (error) {
            console.error("BARQ order submission error:", error);

            showMessage(
                error.message ||
                "Unable to confirm your order. Please check your order history before trying again."
            );

            submittingOrder = false;
            placeOrderButton.disabled = false;
            placeOrderButton.textContent = "Place Order";
        }
    });
}


// ==========================================
// START CHECKOUT
// ==========================================

displayOrder();
