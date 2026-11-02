// ==========================================
// BARQ DRIVER DASHBOARD
// ==========================================

import { db, auth } from "./driver-firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    writeBatch,
    serverTimestamp,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ==========================================
// ELEMENTS
// ==========================================

const driverName = document.getElementById("driver-name");
const assignedOrders = document.getElementById("assigned-orders");
const pendingOrders = document.getElementById("pending-orders");
const deliveryOrders = document.getElementById("delivery-orders");
const deliveredOrders = document.getElementById("delivered-orders");
const ordersContainer = document.getElementById("orders-container");
const driverMessage = document.getElementById("driver-message");
const logoutButton = document.getElementById("logout-btn");
const refreshButton = document.getElementById("refresh-btn");


// ==========================================
// CURRENT DRIVER
// ==========================================

let currentDriver = null;
let ordersUnsubscribe = null;


// ==========================================
// MESSAGE
// ==========================================

function showMessage(text) {
    if (driverMessage) {
        driverMessage.textContent = text;
    }
}


// ==========================================
// HTML ESCAPING
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// ==========================================
// VERIFY DRIVER
// ==========================================

async function verifyDriver(user) {
    if (!user) return false;

    try {
        const usersRef = collection(db, "users");

        const driverQuery = query(
            usersRef,
            where("uid", "==", user.uid)
        );

        const snapshot = await getDocs(driverQuery);

        if (snapshot.empty) return false;

        const driverData = snapshot.docs[0].data();

        if (
            driverData.role !== "driver" &&
            driverData.role !== "Driver"
        ) {
            return false;
        }

        if (driverData.active !== true) return false;

        currentDriver = {
            id: snapshot.docs[0].id,
            ...driverData
        };

        return true;

    } catch (error) {
        console.error("Driver verification error:", error);
        showMessage("Unable to verify driver account.");
        return false;
    }
}


// ==========================================
// DISPLAY ORDERS
// ==========================================

function displayOrders(orders) {

    if (assignedOrders) {
        assignedOrders.textContent = orders.length;
    }

    const pending = orders.filter(order =>
        !order.status ||
        order.status === "Pending" ||
        order.status === "Processing"
    ).length;

    const outForDelivery = orders.filter(
        order => order.status === "Out for Delivery"
    ).length;

    const delivered = orders.filter(
        order => order.status === "Delivered"
    ).length;

    if (pendingOrders) {
        pendingOrders.textContent = pending;
    }

    if (deliveryOrders) {
        deliveryOrders.textContent = outForDelivery;
    }

    if (deliveredOrders) {
        deliveredOrders.textContent = delivered;
    }

    if (!ordersContainer) return;

    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="no-orders">
                <h3>No assigned orders</h3>
                <p>You currently have no delivery orders assigned to you.</p>
            </div>
        `;
        return;
    }

    ordersContainer.innerHTML = "";

    orders.forEach(order => {

        const card = document.createElement("div");
        card.className = "driver-order-card";

        const status = order.status || "Pending";

        const customerName =
            order.customerName || order.name || "Customer";

        const customerPhone =
            order.phone || "-";

        const customerEmail =
            order.email || "-";

        const address =
            order.address ||
            order.deliveryAddress ||
            order.customerAddress ||
            "-";

        let locationHtml = `
            <p>
                <strong>Delivery Location:</strong>
                ${escapeHTML(address)}
            </p>
        `;

        const hasCoordinates =
            typeof order.latitude === "number" &&
            Number.isFinite(order.latitude) &&
            typeof order.longitude === "number" &&
            Number.isFinite(order.longitude);

        if (hasCoordinates) {

            const mapUrl =
                `https://www.google.com/maps?q=${order.latitude},${order.longitude}`;

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
                <h3>Order #${escapeHTML(order.orderNumber || order.id)}</h3>
                <span class="order-status">
                    ${escapeHTML(status)}
                </span>
            </div>

            <div class="customer-details">
                <h4>Customer</h4>

                <p>
                    <strong>Name:</strong>
                    ${escapeHTML(customerName)}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${escapeHTML(customerPhone)}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${escapeHTML(customerEmail)}
                </p>

                ${locationHtml}
            </div>

            <div class="order-total">
                <strong>Order Total:</strong>
                ${Number(order.total || 0).toFixed(2)} SAR
            </div>

            <div class="driver-order-actions">
                <label>Delivery Status</label>

                <select
                    class="driver-status-select"
                    data-order-id="${escapeHTML(order.id)}"
                >
                    <option value="Pending" ${status === "Pending" ? "selected" : ""}>Pending</option>

                    <option value="Out for Delivery" ${status === "Out for Delivery" ? "selected" : ""}>Out for Delivery</option>

                    <option value="Delivered" ${status === "Delivered" ? "selected" : ""}>Delivered</option>

                    <option value="Delivery Delayed" ${status === "Delivery Delayed" ? "selected" : ""}>Delivery Delayed</option>
                </select>
            </div>
        `;

        ordersContainer.appendChild(card);
    });


    // ==========================================
    // DELIVERY STATUS & CODE VERIFICATION
    // ==========================================

    const statusSelects = ordersContainer.querySelectorAll(
        ".driver-status-select"
    );

    statusSelects.forEach(select => {

        select.addEventListener("change", async event => {

            const orderId = event.target.dataset.orderId;
            const newStatus = event.target.value;

            const previousStatus =
                event.target.dataset.previousStatus ||
                "Pending";

            try {

                // ==========================================
                // CUSTOMER CODE REQUIRED BEFORE DELIVERED
                // ==========================================

                if (newStatus === "Delivered") {

                    if (previousStatus !== "Out for Delivery") {
                        alert(
                            "Please change the order to Out for Delivery first."
                        );

                        event.target.value = previousStatus;
                        return;
                    }

                    const enteredCode = prompt(
                        "Enter the customer's 6-digit delivery code:"
                    );

                    if (enteredCode === null) {
                        event.target.value = previousStatus;
                        return;
                    }

                    const code = enteredCode.trim();

                    if (!/^\d{6}$/.test(code)) {
                        alert("Please enter a valid 6-digit code.");
                        event.target.value = previousStatus;
                        return;
                    }

                    showMessage("Verifying delivery code...");

                    const batch = writeBatch(db);

                    const verificationRef = doc(
                        db,
                        "deliveryVerifications",
                        orderId
                    );

                    const orderRef = doc(
                        db,
                        "orders",
                        orderId
                    );

                    batch.set(verificationRef, {
                        orderId: orderId,
                        driverUid: currentDriver.uid,
                        code: code,
                        createdAt: serverTimestamp()
                    });

                    batch.update(orderRef, {
                        status: "Delivered",
                        statusUpdatedAt: serverTimestamp()
                    });

                    await batch.commit();

                    showMessage(
                        "Code verified. Order marked as Delivered."
                    );

                    return;
                }


                // ==========================================
                // OTHER DELIVERY STATUS UPDATES
                // ==========================================

                if (
                    ![
                        "Pending",
                        "Out for Delivery",
                        "Delivery Delayed"
                    ].includes(newStatus)
                ) {
                    event.target.value = previousStatus;
                    return;
                }

                await updateDoc(
                    doc(db, "orders", orderId),
                    {
                        status: newStatus,
                        statusUpdatedAt: serverTimestamp()
                    }
                );

                showMessage(
                    "Delivery status updated successfully."
                );

            } catch (error) {

                console.error(
                    "Delivery status update error:",
                    error
                );

                alert(
                    "Delivery verification failed. Check the code and try again."
                );

                event.target.value = previousStatus;

                showMessage(
                    "Unable to complete delivery verification."
                );
            }
        });

        select.dataset.previousStatus = select.value;
    });

}


// ==========================================
// REAL-TIME LOAD ASSIGNED ORDERS
// ==========================================

function startOrdersListener() {

    if (!currentDriver || !currentDriver.uid) {
        showMessage("Driver account information is incomplete.");
        return;
    }

    if (ordersUnsubscribe) {
        ordersUnsubscribe();
        ordersUnsubscribe = null;
    }

    if (ordersContainer) {
        ordersContainer.innerHTML =
            "Loading your delivery orders...";
    }

    const ordersRef = collection(db, "orders");

    const driverQuery = query(
        ordersRef,
        where("assignedDriverId", "==", currentDriver.uid)
    );

    ordersUnsubscribe = onSnapshot(
        driverQuery,

        snapshot => {

            const orders = [];

            snapshot.forEach(orderDoc => {
                orders.push({
                    id: orderDoc.id,
                    ...orderDoc.data()
                });
            });

            orders.sort((a, b) => {
                const aTime = a.assignedAt?.seconds || 0;
                const bTime = b.assignedAt?.seconds || 0;

                return bTime - aTime;
            });

            displayOrders(orders);

            showMessage("Driver Dashboard ready.");

            console.log(
                "Driver orders updated:",
                orders.length
            );
        },

        error => {

            console.error(
                "Real-time orders listener error:",
                error
            );

            if (ordersContainer) {
                ordersContainer.innerHTML =
                    "<p>Unable to load your delivery orders.</p>";
            }

            showMessage("Unable to receive order updates.");
        }
    );
}


// ==========================================
// LOAD DRIVER DASHBOARD
// ==========================================

async function loadDashboard() {

    showMessage("Loading Driver Dashboard...");

    if (driverName) {
        driverName.textContent =
            currentDriver.name ||
            currentDriver.email ||
            "Driver";
    }

    startOrdersListener();
}


// ==========================================
// MANUAL REFRESH
// ==========================================

if (refreshButton) {

    refreshButton.addEventListener("click", () => {

        showMessage("Refreshing orders...");

        startOrdersListener();
    });
}


// ==========================================
// LOGOUT
// ==========================================

if (logoutButton) {

    logoutButton.addEventListener("click", async () => {

        try {

            showMessage("Logging out...");

            if (ordersUnsubscribe) {
                ordersUnsubscribe();
                ordersUnsubscribe = null;
            }

            await signOut(auth);

            window.location.href = "./driver-login.html";

        } catch (error) {

            console.error("Logout error:", error);

            showMessage("Unable to logout. Please try again.");
        }
    });
}


// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, async user => {

    if (!user) {
        window.location.href = "./driver-login.html";
        return;
    }

    console.log("Current driver:", user.email);

    const isDriver = await verifyDriver(user);

    if (!isDriver) {

        alert("Access denied. Driver account required.");

        await signOut(auth);

        window.location.href = "./driver-login.html";
        return;
    }

    console.log("Driver verified:", user.email);

    await loadDashboard();
});


// ==========================================
// END OF BARQ DRIVER DASHBOARD
// ==========================================
