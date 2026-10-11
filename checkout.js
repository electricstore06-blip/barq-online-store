// ==========================================
// BARQ CHECKOUT — CUSTOMER ACCOUNT LINKING
// ==========================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// CART
// ==========================================

let cart = [];

try {
    const savedCart = JSON.parse(
        localStorage.getItem("barqCart") || "[]"
    );

    cart = Array.isArray(savedCart) ? savedCart : [];
} catch (error) {
    console.error("Could not read cart:", error);
}

// ==========================================
// PAGE ELEMENTS
// ==========================================

const orderItems = document.getElementById("order-items");
const subtotalElement = document.getElementById("subtotal");
const deliveryElement = document.getElementById("delivery");
const totalElement = document.getElementById("total");
const placeOrderButton = document.getElementById("place-order-btn");
const checkoutMessage = document.getElementById("checkout-message");

const locationButton = document.getElementById("get-location-btn");
const locationStatus = document.getElementById("location-status");
const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");
const accuracyInput = document.getElementById("location-accuracy");

// ==========================================
// CURRENT CUSTOMER
// ==========================================

let currentUser = null;
let authReady = false;

onAuthStateChanged(auth, user => {
    currentUser = user;
    authReady = true;

    if (!user) {
        console.log("BARQ Checkout: Customer is not signed in.");
    } else {
        console.log("BARQ Checkout: Customer authenticated.");
    }
});

// ==========================================
// TOTALS
// ==========================================

let subtotal = 0;
let delivery = 0;
let total = 0;

// ==========================================
// DISPLAY ORDER
// ==========================================

function displayOrder() {
    if (!orderItems) return;

    orderItems.replaceChildren();
    subtotal = 0;

    if (cart.length === 0) {
        orderItems.textContent = "Your cart is empty.";

        if (subtotalElement) subtotalElement.textContent = "SAR 0.00";
        if (deliveryElement) deliveryElement.textContent = "SAR 0.00";
        if (totalElement) totalElement.textContent = "SAR 0.00";

        return;
    }

    cart.forEach(item => {
        const itemPrice = Math.max(0, Number(item.price) || 0);
        const itemQuantity = Math.max(0, Number(item.quantity) || 0);
        const itemTotal = itemPrice * itemQuantity;

        subtotal += itemTotal;

        const itemDiv = document.createElement("div");
        itemDiv.className = "order-item";

        const details = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = item.name || "Product";

        const quantity = document.createElement("p");
        quantity.textContent = `Quantity: ${itemQuantity}`;

        details.append(name, quantity);

        const price = document.createElement("div");
        price.textContent = `SAR ${itemTotal.toFixed(2)}`;

        itemDiv.append(details, price);
        orderItems.appendChild(itemDiv);
    });

    delivery = subtotal > 0 ? 15 : 0;
    total = subtotal + delivery;

    if (subtotalElement) {
        subtotalElement.textContent = `SAR ${subtotal.toFixed(2)}`;
    }

    if (deliveryElement) {
        deliveryElement.textContent = `SAR ${delivery.toFixed(2)}`;
    }

    if (totalElement) {
        totalElement.textContent = `SAR ${total.toFixed(2)}`;
    }
}

// ==========================================
// CUSTOMER LOCATION — OPTIONAL
// ==========================================

if (locationButton) {
    locationButton.addEventListener("click", () => {
        if (!navigator.geolocation) {
            if (locationStatus) {
                locationStatus.textContent =
                    "Location is not supported by this browser.";
            }
            return;
        }

        if (locationStatus) {
            locationStatus.textContent = "Getting your location...";
        }

        locationButton.disabled = true;

        navigator.geolocation.getCurrentPosition(
            position => {
                if (latitudeInput) {
                    latitudeInput.value = position.coords.latitude;
                }

                if (longitudeInput) {
                    longitudeInput.value = position.coords.longitude;
                }

                if (accuracyInput) {
                    accuracyInput.value = position.coords.accuracy;
                }

                if (locationStatus) {
                    locationStatus.textContent =
                        "✓ Location selected successfully";
                }

                locationButton.textContent = "📍 Location Selected";
                locationButton.disabled = false;
            },
            error => {
                console.error("Location error:", error);

                if (locationStatus) {
                    locationStatus.textContent =
                        "Unable to get your location. You can continue using your address.";
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
// PLACE ORDER
// ==========================================

if (placeOrderButton) {
    placeOrderButton.addEventListener("click", async () => {
        if (checkoutMessage) {
            checkoutMessage.textContent = "";
        }

        // Wait until Firebase confirms the authentication state.
        if (!authReady) {
            if (checkoutMessage) {
                checkoutMessage.textContent =
                    "Checking your account. Please try again in a moment.";
            }
            return;
        }

        // Customers must sign in before placing an order.
        if (!currentUser) {
            if (checkoutMessage) {
                checkoutMessage.textContent =
                    "Please sign in to your BARQ account before placing your order.";
            }
            return;
        }

        if (cart.length === 0) {
            if (checkoutMessage) {
                checkoutMessage.textContent = "Your cart is empty.";
            }
            return;
        }

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

        const latitude = latitudeInput?.value || "";
        const longitude = longitudeInput?.value || "";
        const locationAccuracy = accuracyInput?.value || "";

        if (!fullName) {
            if (checkoutMessage) {
                checkoutMessage.textContent =
                    "Please enter your full name.";
            }
            return;
        }

        if (!/^05\d{8}$/.test(phone)) {
            if (checkoutMessage) {
                checkoutMessage.textContent =
                    "Please enter a valid Saudi phone number.";
            }
            return;
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (checkoutMessage) {
                checkoutMessage.textContent =
                    "Please enter a valid email address.";
            }
            return;
        }

        if (!address) {
            if (checkoutMessage) {
                checkoutMessage.textContent =
                    "Please enter your delivery address.";
            }
            return;
        }

        if (!paymentElement) {
            if (checkoutMessage) {
                checkoutMessage.textContent =
                    "Please select a payment method.";
            }
            return;
        }

        // Prevent duplicate submissions.
        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Processing Order...";

        try {
            // Recalculate totals.
            subtotal = cart.reduce((sum, item) => {
                const price = Math.max(0, Number(item.price) || 0);
                const quantity = Math.max(0, Number(item.quantity) || 0);
                return sum + price * quantity;
            }, 0);

            delivery = subtotal > 0 ? 15 : 0;
            total = subtotal + delivery;

            const orderNumber =
                "BARQ" +
                Math.floor(100000 + Math.random() * 900000);

            // Link this order to the authenticated Firebase user.
            const orderData = {
                customerUid: currentUser.uid,
                orderNumber,
                customerName: fullName,
                phone,
                email,
                address,

                latitude: latitude ? Number(latitude) : null,
                longitude: longitude ? Number(longitude) : null,
                locationAccuracy: Number(locationAccuracy || 0),

                paymentMethod: paymentElement.value,

                items: cart.map(item => ({
                    productId: String(item.productId || ""),
                    name: String(item.name || "Product"),
                    brand: String(item.brand || ""),
                    price: Math.max(0, Number(item.price) || 0),
                    quantity: Math.max(1, Number(item.quantity) || 1),
                    color: String(item.color || ""),
                    size: String(item.size || "")
                })),

                subtotal,
                delivery,
                total,
                status: "Pending",
                date: new Date().toISOString()
            };

            const orderRef = await addDoc(
                collection(db, "orders"),
                orderData
            );

            // Save this order on the current browser for the success page.
            localStorage.setItem(
                "barqOrder",
                JSON.stringify({
                    id: orderRef.id,
                    ...orderData
                })
            );

            localStorage.setItem(
                "barqOrderTotal",
                total.toFixed(2)
            );

            localStorage.setItem("barqOrderId", orderRef.id);
            localStorage.setItem("barqCustomerEmail", email);
            localStorage.setItem("barqCustomerName", fullName);

            // Clear cart after Firebase successfully saves the order.
            localStorage.removeItem("barqCart");

            window.location.href = "order-success.html";
        } catch (error) {
            console.error("Order submission error:", error);

            if (checkoutMessage) {
                checkoutMessage.textContent =
                    "Unable to place your order. Please try again.";
            }

            placeOrderButton.disabled = false;
            placeOrderButton.textContent = "Place Order";
        }
    });
}

// ==========================================
// START
// ==========================================

displayOrder();
