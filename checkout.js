import { db } from "./firebase-config.js";

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================
   CART
========================================= */

let cart =
    JSON.parse(localStorage.getItem("barqCart")) || [];


/* =========================================
   PAGE ELEMENTS
========================================= */

const orderItems =
    document.getElementById("order-items");

const subtotalElement =
    document.getElementById("subtotal");

const deliveryElement =
    document.getElementById("delivery");

const totalElement =
    document.getElementById("total");

const placeOrderButton =
    document.getElementById("place-order-btn");

const checkoutMessage =
    document.getElementById("checkout-message");


/* =========================================
   CUSTOMER LOCATION ELEMENTS
========================================= */

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


/* =========================================
   ORDER TOTALS
========================================= */

let subtotal = 0;

let delivery = 0;

let total = 0;


/* =========================================
   DISPLAY ORDER
========================================= */

function displayOrder() {

    if (!orderItems) {
        return;
    }

    orderItems.innerHTML = "";

    subtotal = 0;


    if (cart.length === 0) {

        orderItems.innerHTML =
            "<p>Your cart is empty.</p>";

        subtotalElement.textContent =
            "SAR 0.00";

        deliveryElement.textContent =
            "SAR 0.00";

        totalElement.textContent =
            "SAR 0.00";

        return;
    }


    cart.forEach((item) => {

        const itemPrice =
            Number(item.price) || 0;

        const itemQuantity =
            Number(item.quantity) || 0;

        const itemTotal =
            itemPrice * itemQuantity;

        subtotal += itemTotal;


        const itemDiv =
            document.createElement("div");

        itemDiv.className =
            "order-item";


        itemDiv.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <br>
                Quantity: ${itemQuantity}
            </div>

            <div>
                SAR ${itemTotal.toFixed(2)}
            </div>
        `;


        orderItems.appendChild(itemDiv);

    });


    /* Delivery fee */

    delivery =
        subtotal > 0 ? 15 : 0;


    total =
        subtotal + delivery;


    subtotalElement.textContent =
        "SAR " + subtotal.toFixed(2);

    deliveryElement.textContent =
        "SAR " + delivery.toFixed(2);

    totalElement.textContent =
        "SAR " + total.toFixed(2);

}


/* =========================================
   CUSTOMER LOCATION
========================================= */

if (locationButton) {

    locationButton.addEventListener(
        "click",
        function () {

            if (!navigator.geolocation) {

                locationStatus.textContent =
                    "Location is not supported by this browser.";

                return;
            }


            locationStatus.textContent =
                "Getting your location...";

            locationButton.disabled =
                true;


            navigator.geolocation.getCurrentPosition(

                function (position) {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;

                    const accuracy =
                        position.coords.accuracy;


                    latitudeInput.value =
                        latitude;

                    longitudeInput.value =
                        longitude;

                    accuracyInput.value =
                        accuracy;


                    locationStatus.textContent =
                        "✓ Location selected successfully";


                    locationButton.textContent =
                        "📍 Location Selected";

                    locationButton.disabled =
                        false;

                },


                function (error) {

                    locationButton.disabled =
                        false;


                    locationStatus.textContent =
                        "Unable to get your location. Please allow location permission and try again.";


                    console.error(
                        "Location error:",
                        error
                    );

                },


                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }

            );

        }
    );

}


/* =========================================
   PLACE ORDER
========================================= */

if (placeOrderButton) {

    placeOrderButton.addEventListener(
        "click",
        async function () {

            checkoutMessage.textContent = "";


            /* Cart validation */

            if (cart.length === 0) {

                checkoutMessage.textContent =
                    "Your cart is empty.";

                return;
            }


            /* Customer fields */

            const fullName =
                document.getElementById("full-name").value.trim();

            const phone =
                document.getElementById("phone").value.trim();

            const email =
                document.getElementById("email").value.trim();

            const address =
                document.getElementById("address").value.trim();


            /* Payment */

            const paymentElement =
                document.querySelector(
                    'input[name="payment"]:checked'
                );


            /* Location */

            const latitude =
                latitudeInput.value;

            const longitude =
                longitudeInput.value;

            const locationAccuracy =
                accuracyInput.value;


            /* =========================================
               VALIDATION
            ========================================= */

            if (!fullName) {

                checkoutMessage.textContent =
                    "Please enter your full name.";

                return;
            }


            if (!/^05\d{8}$/.test(phone)) {

                checkoutMessage.textContent =
                    "Please enter a valid Saudi phone number.";

                return;
            }


            if (!email) {

                checkoutMessage.textContent =
                    "Please enter your email.";

                return;
            }


            if (!address) {

                checkoutMessage.textContent =
                    "Please enter your delivery address.";

                return;
            }


            if (!paymentElement) {

                checkoutMessage.textContent =
                    "Please select a payment method.";

                return;
            }


         /* Location is optional */

if (!latitude || !longitude) {

    checkoutMessage.textContent =
        "Using delivery address only.";

} 


            /* =========================================
               PREVENT DOUBLE ORDER
            ========================================= */

            placeOrderButton.disabled =
                true;

            placeOrderButton.textContent =
                "Processing Order...";


            try {

                /* Recalculate totals */

                subtotal = 0;


                cart.forEach((item) => {

                    subtotal +=
                        Number(item.price || 0) *
                        Number(item.quantity || 0);

                });


                delivery =
                    subtotal > 0 ? 15 : 0;


                total =
                    subtotal + delivery;


                /* =========================================
                   ORDER NUMBER
                ========================================= */

                const orderNumber =
                    "BARQ" +
                    Math.floor(
                        100000 +
                        Math.random() * 900000
                    );


                /* =========================================
                   ORDER DATA
                ========================================= */

                const orderData = {

                    orderNumber: orderNumber,

                    customerName: fullName,

                    phone: phone,

                    email: email,

                    address: address,


                    /* CUSTOMER GPS LOCATION */

                latitude:
    latitude ? Number(latitude) : null,

longitude:
    longitude ? Number(longitude) : null,

                    locationAccuracy:
                        Number(locationAccuracy || 0),


                    /* PAYMENT */

                    paymentMethod:
                        paymentElement.value,


                    /* PRODUCTS */

                    items: cart,


                    /* TOTALS */

                    subtotal: subtotal,

                    delivery: delivery,

                    total: total,


                    /* ORDER STATUS */

                    status: "Pending",


                    /* DATE */

                    date:
                        new Date().toISOString()

                };


                /* =========================================
                   SAVE ORDER TO FIREBASE
                ========================================= */

                const orderRef =
                    await addDoc(
                        collection(db, "orders"),
                        orderData
                    );


                /* =========================================
                   SAVE ORDER LOCALLY
                ========================================= */

                localStorage.setItem(
                    "barqOrder",
                    JSON.stringify(orderData)
                );

                localStorage.setItem(
                    "barqOrderTotal",
                    total.toFixed(2)
                );

                localStorage.setItem(
                    "barqOrderId",
                    orderRef.id
                );


                /* =========================================
                   CLEAR CART
                ========================================= */

                localStorage.removeItem(
                    "barqCart"
                );


                /* =========================================
                   GO TO SUCCESS PAGE
                ========================================= */

                window.location.href =
                    "order-success.html";

            }


            catch (error) {

                console.error(
                    "Order submission error:",
                    error
                );


                checkoutMessage.textContent =
                    "Unable to place your order. Please try again.";


                placeOrderButton.disabled =
                    false;

                placeOrderButton.textContent =
                    "Place Order";

            }

        }
    );

}


/* =========================================
   START
========================================= */

displayOrder();
