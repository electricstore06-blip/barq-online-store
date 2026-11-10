// ==========================================
// BARQ SUPERVISOR DASHBOARD
// Orders, Drivers, Vehicles, Fuel & Maintenance
// ==========================================

import { db, auth } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
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

const supervisorName = document.getElementById("supervisor-name");
const totalOrders = document.getElementById("total-orders");
const pendingOrders = document.getElementById("pending-orders");
const activeDrivers = document.getElementById("active-drivers");
const deliveryOrders = document.getElementById("delivery-orders");

const driversContainer = document.getElementById("drivers-container");
const ordersContainer = document.getElementById("orders-container");
const message = document.getElementById("supervisor-message");

const logoutButton = document.getElementById("logout-btn");
const refreshDriversButton = document.getElementById("refresh-drivers-btn");
const refreshOrdersButton = document.getElementById("refresh-orders-btn");


// Vehicle elements
const vehicleForm = document.getElementById("vehicle-form");
const vehicleEditId = document.getElementById("vehicle-edit-id");
const vehiclePlate = document.getElementById("vehicle-plate");
const vehicleName = document.getElementById("vehicle-name");
const vehicleModel = document.getElementById("vehicle-model");
const vehicleType = document.getElementById("vehicle-type");
const vehicleDriver = document.getElementById("vehicle-driver");
const vehicleMileage = document.getElementById("vehicle-mileage");
const vehicleRegistrationExpiry = document.getElementById("vehicle-registration-expiry");
const vehicleInsuranceExpiry = document.getElementById("vehicle-insurance-expiry");
const vehicleStatus = document.getElementById("vehicle-status");
const saveVehicleButton = document.getElementById("save-vehicle-btn");
const cancelVehicleEditButton = document.getElementById("cancel-vehicle-edit-btn");
const vehiclesContainer = document.getElementById("vehicles-container");
const refreshVehiclesButton = document.getElementById("refresh-vehicles-btn");


// Fuel elements
const fuelForm = document.getElementById("fuel-form");
const fuelVehicle = document.getElementById("fuel-vehicle");
const fuelType = document.getElementById("fuel-type");
const fuelLitres = document.getElementById("fuel-litres");
const fuelCost = document.getElementById("fuel-cost");
const fuelMileage = document.getElementById("fuel-mileage");
const fuelDate = document.getElementById("fuel-date");
const fuelNotes = document.getElementById("fuel-notes");
const fuelContainer = document.getElementById("fuel-container");
const refreshFuelButton = document.getElementById("refresh-fuel-btn");


// Maintenance elements
const maintenanceForm = document.getElementById("maintenance-form");
const maintenanceVehicle = document.getElementById("maintenance-vehicle");
const maintenanceType = document.getElementById("maintenance-type");
const maintenanceDate = document.getElementById("maintenance-date");
const maintenanceMileage = document.getElementById("maintenance-mileage");
const maintenanceFluidType = document.getElementById("maintenance-fluid-type");
const maintenanceQuantity = document.getElementById("maintenance-quantity");
const maintenanceNextDate = document.getElementById("maintenance-next-date");
const maintenanceNextMileage = document.getElementById("maintenance-next-mileage");
const maintenanceDescription = document.getElementById("maintenance-description");
const maintenanceContainer = document.getElementById("maintenance-container");
const serviceRemindersContainer = document.getElementById("service-reminders-container");
const refreshMaintenanceButton = document.getElementById("refresh-maintenance-btn");


// ==========================================
// CURRENT SESSION DATA
// ==========================================

let currentSupervisor = null;
let availableDrivers = [];
let availableVehicles = [];
let maintenanceRecords = [];


// ==========================================
// HELPERS
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


function showMessage(text, type = "success") {
    if (!message) return;

    message.textContent = text;
    message.className = type;
    message.style.display = "block";

    window.clearTimeout(showMessage.timer);

    showMessage.timer = window.setTimeout(() => {
        message.style.display = "none";
    }, 3500);
}


function formatDate(value) {
    if (!value) return "-";

    let date;

    if (value?.toDate) {
        date = value.toDate();
    } else if (value instanceof Date) {
        date = value;
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString();
}


function dateInputValue(value) {
    if (!value) return "";

    let date;

    if (value?.toDate) {
        date = value.toDate();
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// FIX: supports both element-based calls and older string-based calls.
function showLoading(container, text = "Loading...") {
    if (typeof container === "string") {
        showMessage(container);
        return;
    }

    if (container && typeof container === "object" && "innerHTML" in container) {
        container.innerHTML =
            `<div class="loading-state">${escapeHTML(text)}</div>`;
    }
}


function showEmpty(container, text) {
    if (container) {
        container.innerHTML =
            `<div class="empty-state">${escapeHTML(text)}</div>`;
    }
}


function getVehicleName(vehicle) {
    return `${vehicle.name || "Vehicle"}${vehicle.plate ? " - " + vehicle.plate : ""}`;
}


function getDriverId(driver) {
    return driver.uid || driver.id;
}


function getVehicleById(id) {
    return availableVehicles.find(vehicle => vehicle.id === id);
}


function getDriverById(id) {
    return availableDrivers.find(driver => getDriverId(driver) === id);
}


// ==========================================
// VERIFY SUPERVISOR
// ==========================================

async function verifySupervisor(user) {
    if (!user) return false;

    console.log("SUPERVISOR AUTH UID:", user.uid);

    try {
        const supervisorQuery = query(
            collection(db, "users"),
            where("uid", "==", user.uid)
        );

        const snapshot = await getDocs(supervisorQuery);

        if (snapshot.empty) {
            console.error("Supervisor user record not found.");
            return false;
        }

        const supervisorDoc = snapshot.docs[0];
        const supervisorData = supervisorDoc.data();

        if (
            String(supervisorData.role || "").toLowerCase() !== "supervisor" ||
            supervisorData.active !== true
        ) {
            console.error("Supervisor role or active status is invalid.");
            return false;
        }

        currentSupervisor = {
            id: supervisorDoc.id,
            ...supervisorData
        };

        console.log("Supervisor verification successful.");

        return true;

    } catch (error) {
        console.error("Supervisor verification error:", error);
        return false;
    }
}


// ==========================================
// LOAD DRIVERS
// ==========================================

async function loadDrivers() {
    if (!driversContainer) return;

    showLoading(driversContainer, "Loading drivers...");

    try {
        const driversQuery = query(
            collection(db, "users"),
            where("role", "==", "driver")
        );

        const snapshot = await getDocs(driversQuery);

        availableDrivers = snapshot.docs.map(staffDoc => ({
            id: staffDoc.id,
            ...staffDoc.data()
        }));

        if (activeDrivers) {
            activeDrivers.textContent = availableDrivers.filter(
                driver => driver.active === true
            ).length;
        }

        renderDrivers();
        populateDriverOptions();
        populateVehicleOptions();

    } catch (error) {
        console.error("Load drivers error:", error);

        showEmpty(
            driversContainer,
            "Unable to load drivers. Check Firestore permissions."
        );
    }
}


function renderDrivers() {
    if (!driversContainer) return;

    if (availableDrivers.length === 0) {
        showEmpty(driversContainer, "No drivers found.");
        return;
    }

    driversContainer.innerHTML = "";

    availableDrivers.forEach(driver => {
        const card = document.createElement("div");
        card.className = "driver-card";

        const isActive = driver.active === true;

        card.innerHTML = `
            <div class="driver-info">
                <h3>${escapeHTML(driver.name || "Unnamed Driver")}</h3>
                <p>Email: ${escapeHTML(driver.email || "-")}</p>
                <p>Phone: ${escapeHTML(driver.phone || "-")}</p>
                <p>City: ${escapeHTML(driver.city || "-")}</p>
            </div>

            <span class="status-badge ${isActive ? "status-active" : "status-inactive"}">
                ${isActive ? "Active" : "Inactive"}
            </span>
        `;

        driversContainer.appendChild(card);
    });
}


// ==========================================
// DRIVER SELECT OPTIONS
// ==========================================

function populateDriverOptions() {
    const selects = [vehicleDriver];

    selects.forEach(select => {
        if (!select) return;

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">No driver assigned</option>
        `;

        availableDrivers.forEach(driver => {
            if (driver.active !== true) return;

            const option = document.createElement("option");
            option.value = getDriverId(driver);

            option.textContent =
                `${driver.name || "Unnamed Driver"}${driver.city ? " - " + driver.city : ""}`;

            select.appendChild(option);
        });

        if ([...select.options].some(option => option.value === currentValue)) {
            select.value = currentValue;
        }
    });
}


function createDriverOptions(order) {
    let options = `<option value="">Unassigned</option>`;

    availableDrivers.forEach(driver => {
        const driverId = getDriverId(driver);

        const selected =
            order.assignedDriverId === driverId ? "selected" : "";

        const label =
            `${driver.name || "Unnamed Driver"}${driver.city ? " - " + driver.city : ""}`;

        options += `
            <option value="${escapeHTML(driverId)}" ${selected}>
                ${escapeHTML(label)}
            </option>
        `;
    });

    return options;
}


// ==========================================
// LOAD ORDERS
// ==========================================

async function loadOrders() {
    if (!ordersContainer) return;

    showLoading(ordersContainer, "Loading orders...");

    try {
        const snapshot = await getDocs(
            collection(db, "orders")
        );

        const orders = snapshot.docs.map(orderDoc => ({
            id: orderDoc.id,
            ...orderDoc.data()
        }));

        if (totalOrders) {
            totalOrders.textContent = orders.length;
        }

        const pending = orders.filter(order =>
            !order.status || order.status === "Pending"
        ).length;

        const delivery = orders.filter(order =>
            order.status === "Out for Delivery"
        ).length;

        if (pendingOrders) {
            pendingOrders.textContent = pending;
        }

        if (deliveryOrders) {
            deliveryOrders.textContent = delivery;
        }

        if (orders.length === 0) {
            showEmpty(ordersContainer, "No orders found.");
            return;
        }

        ordersContainer.innerHTML = "";

        orders.forEach(order => {
            const card = document.createElement("div");
            card.className = "order-card";

            const status = order.status || "Pending";

            const customerName =
                order.customerName || order.name || "Customer";

            const customerEmail =
                order.customerEmail || order.email || "-";

            const customerPhone =
                order.phone || order.customerPhone || "-";

            const assignedDriverName =
                order.assignedDriverName || "Unassigned";

            card.innerHTML = `
                <h3>Order #${escapeHTML(order.id)}</h3>

                <p><strong>Customer:</strong> ${escapeHTML(customerName)}</p>
                <p><strong>Email:</strong> ${escapeHTML(customerEmail)}</p>
                <p><strong>Phone:</strong> ${escapeHTML(customerPhone)}</p>

                <p>
                    <strong>Total:</strong>
                    ${Number(order.total || 0).toFixed(2)} SAR
                </p>

                <p><strong>Status:</strong> ${escapeHTML(status)}</p>

                <div class="order-actions">
                    <label>Update Status:</label>

                    <select class="status-select"
                            data-order-id="${escapeHTML(order.id)}">

                        ${[
                            "Pending",
                            "Processing",
                            "Shipped",
                            "Out for Delivery",
                            "Delivered",
                            "Delivery Delayed"
                        ].map(option => `
                            <option value="${escapeHTML(option)}"
                                ${status === option ? "selected" : ""}>
                                ${escapeHTML(option)}
                            </option>
                        `).join("")}

                    </select>
                </div>

                <div class="order-actions">
                    <label>Assign Driver:</label>

                    <select class="driver-select"
                            data-order-id="${escapeHTML(order.id)}">

                        ${createDriverOptions(order)}

                    </select>
                </div>

                <p>
                    <strong>Assigned Driver:</strong>
                    <span class="assigned-driver-name">
                        ${escapeHTML(assignedDriverName)}
                    </span>
                </p>
            `;

            ordersContainer.appendChild(card);
        });

        attachOrderEvents();

    } catch (error) {
        console.error("Load orders error:", error);

        showEmpty(
            ordersContainer,
            "Unable to load orders. Check Firestore permissions."
        );
    }
}


// ==========================================
// ORDER STATUS AND DRIVER ASSIGNMENT
// ==========================================

function attachOrderEvents() {
    const statusSelects =
        ordersContainer.querySelectorAll(".status-select");

    statusSelects.forEach(select => {
        select.addEventListener("change", async event => {
            const orderId = event.target.dataset.orderId;
            const newStatus = event.target.value;

            event.target.disabled = true;

            try {
                await updateDoc(
                    doc(db, "orders", orderId),
                    {
                        status: newStatus,
                        statusUpdatedAt: new Date()
                    }
                );

                showMessage("Order status updated successfully.");

                await loadOrders();

            } catch (error) {
                console.error("Order status update error:", error);

                showMessage("Unable to update order status.", "error");

                event.target.disabled = false;
            }
        });
    });


    const driverSelects =
        ordersContainer.querySelectorAll(".driver-select");

    driverSelects.forEach(select => {
        select.addEventListener("change", async event => {
            const orderId = event.target.dataset.orderId;
            const selectedDriverId = event.target.value;

            event.target.disabled = true;

            try {
                if (!selectedDriverId) {
                    await updateDoc(
                        doc(db, "orders", orderId),
                        {
                            assignedDriverId: null,
                            assignedDriverName: null,
                            assignedDriverPhone: null,
                            assignedDriverCity: null,
                            assignedAt: null,
                            assignedByUid: null
                        }
                    );

                    showMessage("Driver unassigned successfully.");

                    await loadOrders();

                    return;
                }

                const selectedDriver = getDriverById(selectedDriverId);

                if (!selectedDriver) {
                    showMessage("Driver not found.", "error");

                    event.target.disabled = false;

                    return;
                }

                await updateDoc(
                    doc(db, "orders", orderId),
                    {
                        assignedDriverId: getDriverId(selectedDriver),
                        assignedDriverName: selectedDriver.name || "Unnamed Driver",
                        assignedDriverPhone: selectedDriver.phone || null,
                        assignedDriverCity: selectedDriver.city || null,
                        assignedAt: new Date(),
                        assignedByUid: currentSupervisor.uid
                    }
                );

                showMessage("Driver assigned successfully.");

                await loadOrders();

            } catch (error) {
                console.error("Driver assignment error:", error);

                showMessage("Unable to assign driver.", "error");

                event.target.disabled = false;
            }
        });
    });
}


// ==========================================
// VEHICLE SELECT OPTIONS
// ==========================================

function populateVehicleOptions() {
    [fuelVehicle, maintenanceVehicle].forEach(select => {
        if (!select) return;

        const previousValue = select.value;

        select.innerHTML = `
            <option value="">Select vehicle</option>
        `;

        availableVehicles
            .filter(vehicle =>
                String(vehicle.status || "").trim().toLowerCase() === "active"
            )
            .forEach(vehicle => {
                const option = document.createElement("option");

                option.value = vehicle.id;
                option.textContent = getVehicleName(vehicle);

                select.appendChild(option);
            });

        if ([...select.options].some(option => option.value === previousValue)) {
            select.value = previousValue;
        }
    });
}
