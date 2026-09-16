import { db, auth } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* =========================================
   ELEMENTS
========================================= */

const ordersContainer =
    document.getElementById("orders-container");

const adminMessage =
    document.getElementById("admin-message");

const refreshButton =
    document.getElementById("refresh-btn");

const logoutButton =
    document.getElementById("logout-btn");


/* =========================================
   CHECK ADMIN LOGIN
========================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "index.html";

        return;
    }


    console.log(
        "Logged-in user:",
        user.email
    );


    try {

        /* Check this user's admin document */

        const adminRef =
            doc(db, "admins", user.uid);

        const adminSnap =
            await getDoc(adminRef);


        /* Admin document does not exist */

        if (!adminSnap.exists()) {

            console.error(
                "User is not an admin."
            );

            alert(
                "Access denied. You are not an administrator."
            );

            await signOut(auth);

            window.location.href =
                "index.html";

            return;
        }


        /* Check admin role */

        const adminData =
            adminSnap.data();


        if (adminData.role !== "admin") {

            console.error(
                "User does not have admin role."
            );

            alert(
                "Access denied. You are not an administrator."
            );

            await signOut(auth);

            window.location.href =
                "index.html";

            return;
        }


        console.log(
            "Admin access confirmed:",
            user.email
        );


        /* Only now load orders */

        loadOrders();

    }


    catch (error) {

        console.error(
            "Admin verification error:",
            error
        );


        adminMessage.textContent =
            "Unable to verify admin access.";

    }

});


/* =========================================
   LOAD ORDERS
========================================= */

async function loadOrders() {

    ordersContainer.innerHTML = "";

    adminMessage.textContent =
        "Loading orders...";


    try {

        const snapshot =
            await getDocs(
                collection(db, "orders")
            );


        if (snapshot.empty) {

            adminMessage.textContent =
                "No orders found.";

            return;
        }


        const orders = [];


        snapshot.forEach((doc) => {

            orders.push({
                id: doc.id,
                ...doc.data()
            });

        });


        /* Newest orders first */

        orders.sort((a, b) => {

            const dateA =
                new Date(a.date || 0).getTime();

            const dateB =
                new Date(b.date || 0).getTime();

            return dateB - dateA;

        });


        adminMessage.textContent =
            orders.length +
            " order(s) found.";


        orders.forEach((order) => {

            displayOrder(order);

        });

    }


    catch (error) {

        console.error(
            "Error loading orders:",
            error
        );


        adminMessage.textContent =
            "Unable to load orders.";

    }

}


/* =========================================
   DISPLAY ONE ORDER
========================================= */

function displayOrder(order) {

    const orderCard =
        document.createElement("div");

    orderCard.className =
        "order-card";


    /* =========================================
       CUSTOMER INFORMATION
    ========================================= */

    const customerName =
        order.customerName ||
        "Customer";


    const phone =
        order.phone ||
        "Not provided";


    const email =
        order.email ||
        "Not provided";


    const address =
        order.address ||
        "Not provided";


    /* =========================================
       ORDER INFORMATION
    ========================================= */

    const orderNumber =
        order.orderNumber ||
        "BARQ0000";


    const status =
        order.status ||
        "Pending";


    const paymentMethod =
        order.paymentMethod ||
        "Not selected";


    const subtotal =
        Number(order.subtotal || 0);


    const delivery =
        Number(order.delivery || 0);


    const total =
        Number(order.total || 0);


    /* =========================================
       DATE
    ========================================= */

    let orderDate =
        "Date not available";


    if (order.date) {

        const date =
            new Date(order.date);


        if (!isNaN(date.getTime())) {

            orderDate =
                date.toLocaleString();

        }

    }


    /* =========================================
       LOCATION
    ========================================= */

    let locationHTML =
        `<span class="no-location">
            Location not available
        </span>`;


    if (
        order.latitude !== undefined &&
        order.longitude !== undefined
    ) {

        const latitude =
            Number(order.latitude);

        const longitude =
            Number(order.longitude);


        if (
            !isNaN(latitude) &&
            !isNaN(longitude)
        ) {

            const mapURL =
                "https://www.google.com/maps?q=" +
                latitude +
                "," +
                longitude;


            locationHTML = `
                <a
                    href="${mapURL}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="location-link"
                >
                    📍 Open Customer Location
                </a>
            `;

        }

    }


    /* =========================================
       PRODUCTS
    ========================================= */

    let productsHTML =
        "<p>No products found.</p>";


    if (
        Array.isArray(order.items) &&
        order.items.length > 0
    ) {

        productsHTML = "<ul>";


        order.items.forEach((item) => {

            const name =
                item.name ||
                "Product";


            const quantity =
                Number(item.quantity || 0);


            const price =
                Number(item.price || 0);


            productsHTML += `
                <li>
                    <strong>${name}</strong>
                    <br>
                    Quantity: ${quantity}
                    <br>
                    Price: SAR ${price.toFixed(2)}
                </li>
            `;

        });


        productsHTML += "</ul>";

    }


    /* =========================================
       ORDER CARD
    ========================================= */

    orderCard.innerHTML = `

        <div class="order-card-header">

            <div>

                <h3>
                    ${orderNumber}
                </h3>

                <p>
                    ${orderDate}
                </p>

            </div>


            <span class="status">
                ${status}
            </span>

        </div>


        <div class="customer-section">

            <h4>
                Customer Information
            </h4>


            <p>
                <strong>Name:</strong>
                ${customerName}
            </p>


            <p>
                <strong>Phone:</strong>
                ${phone}
            </p>


            <p>
                <strong>Email:</strong>
                ${email}
            </p>


            <p>
                <strong>Address:</strong>
                ${address}
            </p>


            <div class="location-box">

                <strong>
                    Customer Location:
                </strong>

                <br>

                ${locationHTML}

            </div>

        </div>


        <div class="products-section">

            <h4>
                Products
            </h4>

            ${productsHTML}

        </div>


        <div class="payment-section">

            <h4>
                Payment
            </h4>


            <p>
                <strong>Method:</strong>
                ${paymentMethod}
            </p>


            <p>
                <strong>Subtotal:</strong>
                SAR ${subtotal.toFixed(2)}
            </p>


            <p>
                <strong>Delivery:</strong>
                SAR ${delivery.toFixed(2)}
            </p>


            <p class="order-total">

                <strong>
                    Total:
                </strong>

                SAR ${total.toFixed(2)}

            </p>

        </div>

    `;


    ordersContainer.appendChild(
        orderCard
    );

}


/* =========================================
   REFRESH
========================================= */

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        loadOrders
    );

}


/* =========================================
   LOGOUT
========================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            try {

                await signOut(auth);

                window.location.href =
                    "index.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}
