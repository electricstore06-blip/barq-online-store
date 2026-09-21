// ==========================================
// BARQ SUPERVISOR DASHBOARD
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

const supervisorName =
    document.getElementById("supervisor-name");

const totalOrders =
    document.getElementById("total-orders");

const pendingOrders =
    document.getElementById("pending-orders");

const activeDrivers =
    document.getElementById("active-drivers");

const deliveryOrders =
    document.getElementById("delivery-orders");

const driversContainer =
    document.getElementById("drivers-container");

const ordersContainer =
    document.getElementById("orders-container");

const message =
    document.getElementById("supervisor-message");

const logoutButton =
    document.getElementById("logout-btn");

const refreshDriversButton =
    document.getElementById("refresh-drivers-btn");

const refreshOrdersButton =
    document.getElementById("refresh-orders-btn");


// ==========================================
// CURRENT SUPERVISOR
// ==========================================

let currentSupervisor = null;


// ==========================================
// AVAILABLE DRIVERS
// ==========================================

let availableDrivers = [];


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(text) {

    if (message) {
        message.textContent = text;
    }

}


// ==========================================
// VERIFY SUPERVISOR
// ==========================================

async function verifySupervisor(user) {

    if (!user) {
        return false;
    }

    try {

        const usersRef =
            collection(db, "users");

        const q =
            query(
                usersRef,
                where("uid", "==", user.uid)
            );

        const snapshot =
            await getDocs(q);

        if (snapshot.empty) {
            return false;
        }

        const staffData =
            snapshot.docs[0].data();

        if (
            staffData.role !== "Supervisor" &&
            staffData.role !== "supervisor"
        ) {
            return false;
        }

        currentSupervisor = {
            id: snapshot.docs[0].id,
            ...staffData
        };

        return true;

    } catch (error) {

        console.error(
            "Supervisor verification error:",
            error
        );

        return false;
    }

}


// ==========================================
// LOAD DRIVERS
// ==========================================

async function loadDrivers() {

    if (!driversContainer) {
        return;
    }

    driversContainer.innerHTML =
        "Loading drivers...";

    try {

        const driversQuery =
            query(
                collection(db, "users"),
                where("role", "==", "driver")
            );

        const usersSnapshot =
            await getDocs(driversQuery);

        const drivers = [];

        usersSnapshot.forEach(
            (staffDoc) => {

                const data =
                    staffDoc.data();

                if (
                    data.role === "Driver" ||
                    data.role === "driver"
                ) {

                    drivers.push({
                        id: staffDoc.id,
                        ...data
                    });

                }

            }
        );


        // Save drivers for order assignment
        availableDrivers = drivers;


        // Active driver count
        if (activeDrivers) {

            activeDrivers.textContent =
                drivers.filter(
                    driver =>
                        driver.active === true
                ).length;

        }


        if (drivers.length === 0) {

            driversContainer.innerHTML =
                "<p>No drivers found.</p>";

            return;
        }


        driversContainer.innerHTML = "";


        drivers.forEach(
            (driver) => {

                const card =
                    document.createElement("div");

                card.className =
                    "driver-card";


                const status =
                    driver.active === true
                        ? "Active"
                        : "Inactive";


                const statusClass =
                    driver.active === true
                        ? "active"
                        : "inactive";


                card.innerHTML = `
                    <div class="driver-info">

                        <h3>
                            ${driver.name || "Unnamed Driver"}
                        </h3>

                        <p>
                            Email:
                            ${driver.email || "-"}
                        </p>

                        <p>
                            Phone:
                            ${driver.phone || "-"}
                        </p>

                        <p>
                            City:
                            ${driver.city || "-"}
                        </p>

                    </div>

                    <div class="driver-status ${statusClass}">
                        ${status}
                    </div>
                `;


                driversContainer.appendChild(card);

            }
        );


    } catch (error) {

        console.error(
            "Load drivers error:",
            error
        );

        driversContainer.innerHTML =
            "<p>Unable to load drivers.</p>";

    }

}


// ==========================================
// DRIVER ASSIGNMENT OPTIONS
// ==========================================

function createDriverOptions(order) {

    let options = `
        <option value="">
            Unassigned
        </option>
    `;


    availableDrivers.forEach(
        (driver) => {

            const driverId =
                driver.uid || driver.id;

            const selected =
                order.assignedDriverId === driverId
                    ? "selected"
                    : "";


            options += `
                <option
                    value="${driverId}"
                    ${selected}
                >
                    ${driver.name || "Unnamed Driver"}
                    ${driver.city ? " - " + driver.city : ""}
                </option>
            `;

        }
    );


    return options;

}


// ==========================================
// LOAD ORDERS
// ==========================================

async function loadOrders() {

    if (!ordersContainer) {
        return;
    }

    ordersContainer.innerHTML =
        "Loading orders...";

    try {

        const ordersSnapshot =
            await getDocs(
                collection(db, "orders")
            );

        const orders = [];


        ordersSnapshot.forEach(
            (orderDoc) => {

                orders.push({

                    id: orderDoc.id,

                    ...orderDoc.data()

                });

            }
        );


        // ==================================
        // SUMMARY
        // ==================================

        if (totalOrders) {

            totalOrders.textContent =
                orders.length;

        }


        const pending =
            orders.filter(
                order =>
                    !order.status ||
                    order.status === "Pending"
            ).length;


        const delivery =
            orders.filter(
                order =>
                    order.status ===
                    "Out for Delivery"
            ).length;


        if (pendingOrders) {

            pendingOrders.textContent =
                pending;

        }


        if (deliveryOrders) {

            deliveryOrders.textContent =
                delivery;

        }


        // ==================================
        // NO ORDERS
        // ==================================

        if (orders.length === 0) {

            ordersContainer.innerHTML =
                "<p>No orders found.</p>";

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
                    "order-card";


                const status =
                    order.status ||
                    "Pending";


                const customerName =
                    order.customerName ||
                    order.name ||
                    "Customer";


                const customerEmail =
                    order.customerEmail ||
                    order.email ||
                    "-";


                const customerPhone =
                    order.phone ||
                    order.customerPhone ||
                    "-";


                const assignedDriverName =
                    order.assignedDriverName ||
                    "Unassigned";


                card.innerHTML = `

                    <h3>
                        Order #${order.id}
                    </h3>

                    <p>
                        <strong>Customer:</strong>
                        ${customerName}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${customerEmail}
                    </p>

                    <p>
                        <strong>Phone:</strong>
                        ${customerPhone}
                    </p>

                    <p>
                        <strong>Total:</strong>
                        ${Number(
                            order.total || 0
                        ).toFixed(2)} SAR
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${status}
                    </p>


                    <!-- STATUS -->

                    <div class="order-actions">

                        <label>
                            Update Status:
                        </label>

                        <select
                            class="status-select"
                            data-order-id="${order.id}"
                        >

                            <option
                                value="Pending"
                                ${status === "Pending" ? "selected" : ""}
                            >
                                Pending
                            </option>

                            <option
                                value="Processing"
                                ${status === "Processing" ? "selected" : ""}
                            >
                                Processing
                            </option>

                            <option
                                value="Shipped"
                                ${status === "Shipped" ? "selected" : ""}
                            >
                                Shipped
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


                    <!-- DRIVER ASSIGNMENT -->

                    <div class="order-actions">

                        <label>
                            Assign Driver:
                        </label>

                        <select
                            class="driver-select"
                            data-order-id="${order.id}"
                        >

                            ${createDriverOptions(order)}

                        </select>

                    </div>


                    <p>
                        <strong>Assigned Driver:</strong>
                        <span class="assigned-driver-name">
                            ${assignedDriverName}
                        </span>
                    </p>

                `;


                ordersContainer.appendChild(card);

            }
        );


        // ==================================
        // STATUS CHANGE
        // ==================================

        const statusSelects =
            ordersContainer.querySelectorAll(
                ".status-select"
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
                                "Order status updated successfully."
                            );


                            await loadOrders();


                        } catch (error) {

                            console.error(
                                "Order status update error:",
                                error
                            );


                            showMessage(
                                "Unable to update order status."
                            );

                        }

                    }
                );

            }
        );


        // ==================================
        // DRIVER ASSIGNMENT CHANGE
        // ==================================

        const driverSelects =
            ordersContainer.querySelectorAll(
                ".driver-select"
            );


        driverSelects.forEach(
            (select) => {

                select.addEventListener(
                    "change",
                    async (event) => {

                        const orderId =
                            event.target
                                .dataset
                                .orderId;


                        const selectedDriverId =
                            event.target.value;


                        try {

                            // --------------------------
                            // UNASSIGN DRIVER
                            // --------------------------

                            if (!selectedDriverId) {

                                await updateDoc(
                                    doc(
                                        db,
                                        "orders",
                                        orderId
                                    ),
                                    {

                                        assignedDriverId:
                                            null,

                                        assignedDriverName:
                                            null,

                                        assignedDriverPhone:
                                            null,

                                        assignedDriverCity:
                                            null,

                                        assignedAt:
                                            null,

                                        assignedByUid:
                                            null
                                    }
                                );


                                showMessage(
                                    "Driver unassigned successfully."
                                );


                                await loadOrders();

                                return;
                            }


                            // --------------------------
                            // FIND DRIVER
                            // --------------------------

                            const selectedDriver =
                                availableDrivers.find(
                                    driver =>
                                        (
                                            driver.uid ||
                                            driver.id
                                        ) ===
                                        selectedDriverId
                                );


                            if (!selectedDriver) {

                                showMessage(
                                    "Driver not found."
                                );

                                return;
                            }


                            // --------------------------
                            // ASSIGN DRIVER
                            // --------------------------

                            await updateDoc(
                                doc(
                                    db,
                                    "orders",
                                    orderId
                                ),
                                {

                                    assignedDriverId:
                                        selectedDriver.uid ||
                                        selectedDriver.id,

                                    assignedDriverName:
                                        selectedDriver.name ||
                                        "Unnamed Driver",

                                    assignedDriverPhone:
                                        selectedDriver.phone ||
                                        null,

                                    assignedDriverCity:
                                        selectedDriver.city ||
                                        null,

                                    assignedAt:
                                        new Date(),

                                    assignedByUid:
                                        currentSupervisor.uid
                                }
                            );


                            showMessage(
                                "Driver assigned successfully."
                            );


                            await loadOrders();


                        } catch (error) {

                            console.error(
                                "Driver assignment error:",
                                error
                            );


                            showMessage(
                                "Unable to assign driver."
                            );

                        }

                    }
                );

            }
        );


    } catch (error) {

        console.error(
            "Load orders error:",
            error
        );


        ordersContainer.innerHTML =
            "<p>Unable to load orders.</p>";

    }

}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    showMessage(
        "Loading Supervisor Dashboard..."
    );


    await loadDrivers();


    await loadOrders();


    showMessage(
        "Supervisor Dashboard ready."
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
// REFRESH BUTTONS
// ==========================================

if (refreshDriversButton) {

    refreshDriversButton.addEventListener(
        "click",
        async () => {

            await loadDrivers();

            await loadOrders();

        }
    );

}


if (refreshOrdersButton) {

    refreshOrdersButton.addEventListener(
        "click",
        loadOrders
    );

}


// ==========================================
// AUTH CHECK
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }


        const isSupervisor =
            await verifySupervisor(user);


        if (!isSupervisor) {

            alert(
                "Access denied. Supervisor account required."
            );


            window.location.href =
                "index.html";

            return;
        }


        // ==================================
        // SHOW SUPERVISOR NAME
        // ==================================

        if (supervisorName) {

            supervisorName.textContent =
                currentSupervisor.name ||
                user.email ||
                "Supervisor";

        }


        console.log(
            "Supervisor verified:",
            user.email
        );


        await loadDashboard();

    }
);
