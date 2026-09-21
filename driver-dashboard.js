// ==========================================
// BARQ DRIVER DASHBOARD
// ==========================================

import { db, auth } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ==========================================
// ELEMENTS
// ==========================================

const driverName =
    document.getElementById("driver-name");

const assignedOrders =
    document.getElementById("assigned-orders");

const pendingOrders =
    document.getElementById("pending-orders");

const deliveryOrders =
    document.getElementById("delivery-orders");

const deliveredOrders =
    document.getElementById("delivered-orders");

const ordersContainer =
    document.getElementById("orders-container");

const driverMessage =
    document.getElementById("driver-message");

const logoutButton =
    document.getElementById("logout-btn");

const refreshButton =
    document.getElementById("refresh-btn");


// ==========================================
// CURRENT DRIVER
// ==========================================

let currentDriver = null;


// ==========================================
// MESSAGE
// ==========================================

function showMessage(text) {

    if (driverMessage) {
        driverMessage.textContent = text;
    }

}


// ==========================================
// VERIFY DRIVER
// ==========================================

async function verifyDriver(user) {

    if (!user) {
        return false;
    }

    try {

        const usersRef =
            collection(db, "users");

        const driverQuery =
            query(
                usersRef,
                where("uid", "==", user.uid)
            );

        const snapshot =
            await getDocs(driverQuery);


        if (snapshot.empty) {
            return false;
        }


        const driverData =
            snapshot.docs[0].data();


        if (
            driverData.role !== "driver" &&
            driverData.role !== "Driver"
        ) {
            return false;
        }


        if (driverData.active !== true) {
            return false;
        }


        currentDriver = {

            id:
                snapshot.docs[0].id,

            ...driverData

        };


        return true;


    } catch (error) {

        console.error(
            "Driver verification error:",
            error
        );

        return false;

    }

}


// ==========================================
// LOAD ASSIGNED ORDERS
// ==========================================

async function loadOrders() {

    if (!ordersContainer) {
        return;
    }


    ordersContainer.innerHTML =
        "Loading your delivery orders...";


    try {

        const ordersRef =
            collection(db, "orders");


        const driverQuery =
            query(
                ordersRef,
                where(
                    "assignedDriverId",
                    "==",
                    currentDriver.uid
                )
            );


        const snapshot =
            await getDocs(driverQuery);


        const orders = [];


        snapshot.forEach(
            (orderDoc) => {

                orders.push({

                    id:
                        orderDoc.id,

                    ...orderDoc.data()

                });

            }
        );


        // ==================================
        // SUMMARY
        // ==================================

        if (assignedOrders) {

            assignedOrders.textContent =
                orders.length;

        }


        const pending =
            orders.filter(
                order =>
                    !order.status ||
                    order.status === "Pending" ||
                    order.status === "Processing"
            ).length;


        const outForDelivery =
            orders.filter(
                order =>
                    order.status ===
                    "Out for Delivery"
            ).length;


        const delivered =
            orders.filter(
                order =>
                    order.status ===
                    "Delivered"
            ).length;


        if (pendingOrders) {

            pendingOrders.textContent =
                pending;

        }


        if (deliveryOrders) {

            deliveryOrders.textContent =
                outForDelivery;

        }


        if (deliveredOrders) {

            deliveredOrders.textContent =
                delivered;

        }


        // ==================================
        // NO ORDERS
        // ==================================

        if (orders.length === 0) {

            ordersContainer.innerHTML = `
                <div class="no-orders">
                    <h3>No assigned orders</h3>

                    <p>
                        You currently have no delivery
                        orders assigned to you.
                    </p>
                </div>
            `;

            return;

        }


        // ==================================
        // DISPLAY ORDERS
        // ==================================

        ordersContainer.innerHTML = "";


        orders.forEach(
            (order) => {

                const card =
                    document.createElement("div");


                card.className =
                    "driver-order-card";


                const status =
                    order.status ||
                    "Pending";


                const customerName =
                    order.customerName ||
                    order.name ||
                    "Customer";


                const customerPhone =
                    order.customerPhone ||
                    order.phone ||
                    "-";


                const customerEmail =
                    order.customerEmail ||
                    order.email ||
                    "-";


                const address =
                    order.address ||
                    order.deliveryAddress ||
                    order.customerAddress ||
                    "-";


                const latitude =
                    order.latitude;


                const longitude =
                    order.longitude;


                let locationHtml = `
                    <p>
                        <strong>Delivery Location:</strong>
                        ${address}
                    </p>
                `;


                if (
                    latitude !== undefined &&
                    longitude !== undefined
                ) {

                    const mapUrl =
                        `https://www.google.com/maps?q=${latitude},${longitude}`;


                    locationHtml += `
                        <p>
                            <a
                                href="${mapUrl}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                📍 Open Customer Location
                            </a>
                        </p>
                    `;

                }


                card.innerHTML = `

                    <div class="driver-order-header">

                        <h3>
                            Order #${order.id}
                        </h3>

                        <span class="order-status">
                            ${status}
                        </span>

                    </div>


                    <div class="customer-details">

                        <h4>
                            Customer
                        </h4>

                        <p>
                            <strong>Name:</strong>
                            ${customerName}
                        </p>

                        <p>
                            <strong>Phone:</strong>
                            ${customerPhone}
                        </p>

                        <p>
                            <strong>Email:</strong>
                            ${customerEmail}
                        </p>

                        ${locationHtml}

                    </div>


                    <div class="order-total">

                        <strong>
                            Order Total:
                        </strong>

                        ${Number(
                            order.total || 0
                        ).toFixed(2)} SAR

                    </div>


                    <div class="driver-order-actions">

                        <label>
                            Delivery Status
                        </label>


                        <select
                            class="driver-status-select"
                            data-order-id="${order.id}"
                        >

                            <option
                                value="Pending"
                                ${status === "Pending" ? "selected" : ""}
                            >
                                Pending
                            </option>

                            <option
                                value="Out for Delivery"
                                ${status === "Out for Delivery" ? "selected" : ""}
                            >
                                Out for Delivery
                            </option>

                            <option
                                value="Delivered"
                                ${status === "Delivered" ? "selected" : ""}
                            >
                                Delivered
                            </option>

                            <option
                                value="Delivery Delayed"
                                ${status === "Delivery Delayed" ? "selected" : ""}
                            >
                                Delivery Delayed
                            </option>

                        </select>

                    </div>

                `;


                ordersContainer.appendChild(card);

            }
        );


        // ==================================
        // STATUS UPDATES
        // ==================================

        const statusSelects =
            ordersContainer.querySelectorAll(
                ".driver-status-select"
            );


        statusSelects.forEach(
            (select) => {

                select.addEventListener(
                    "change",
                    async (event) => {

                        const orderId =
                            event.target
                                .dataset
                                .orderId;


                        const newStatus =
                            event.target.value;


                        try {

                            await updateDoc(
                                doc(
                                    db,
                                    "orders",
                                    orderId
                                ),
                                {

                                    status:
                                        newStatus,

                                    statusUpdatedAt:
                                        new Date()

                                }
                            );


                            showMessage(
                                "Delivery status updated successfully."
                            );


                            await loadOrders();


                        } catch (error) {

                            console.error(
                                "Delivery status update error:",
                                error
                            );


                            showMessage(
                                "Unable to update delivery status."
                            );

                        }

                    }
                );

            }
        );


    } catch (error) {

        console.error(
            "Load driver orders error:",
            error
        );


        ordersContainer.innerHTML = `
            <p>
                Unable to load your delivery orders.
            </p>
        `;

    }

}


// ==========================================
// LOAD DRIVER DASHBOARD
// ==========================================

async function loadDashboard() {

    showMessage(
        "Loading Driver Dashboard..."
    );


    if (driverName) {

        driverName.textContent =
            currentDriver.name ||
            currentDriver.email ||
            "Driver";

    }


    await loadOrders();


    showMessage(
        "Driver Dashboard ready."
    );

}


// ==========================================
// REFRESH
// ==========================================

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            await loadOrders();

        }
    );

}


// ==========================================
// LOGOUT
// ==========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);


                window.location.href =
                    "index.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "index.html";

            return;

        }


        console.log(
            "Current driver:",
            user.email
        );


        const isDriver =
            await verifyDriver(user);


        if (!isDriver) {

            alert(
                "Access denied. Driver account required."
            );


            window.location.href =
                "index.html";

            return;

        }


        console.log(
            "Driver verified:",
            user.email
        );


        await loadDashboard();

    }
);
