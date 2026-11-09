
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


function showLoading(container, text = "Loading...") {
    if (container) {
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
        const usersQuery = query(
            collection(db, "users"),
            where("uid", "==", user.uid)
        );

        const snapshot = await getDocs(usersQuery);

        if (snapshot.empty) {
            console.error("Supervisor user document not found.");
            return false;
        }

        const staffDocument = snapshot.docs[0];
        console.log("SUPERVISOR DOCUMENT ID:", staffDocument.id);
console.log("SUPERVISOR DATA UID:", staffDocument.data().uid);
        const staffData = staffDocument.data();

        // Match the supervisor security rule:
        // role must be lowercase "supervisor"
        // and active must be true.
        if (
            staffData.role !== "supervisor" ||
            staffData.active !== true
        ) {
            console.error("Supervisor role or active status is invalid.");
            return false;
        }

        currentSupervisor = {
            id: staffDocument.id,
            ...staffData
        };

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
        // The existing supervisor rules allow the lowercase driver role.
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
        showEmpty(driversContainer, "Unable to load drivers. Check Firestore permissions.");
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
        showEmpty(ordersContainer, "Unable to load orders. Check Firestore permissions.");
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
            .filter(vehicle => vehicle.status === "active")
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


// ==========================================
// LOAD VEHICLES
// ==========================================

async function loadVehicles() {
    if (!vehiclesContainer) return;

    showLoading(vehiclesContainer, "Loading vehicles...");

    try {
        const snapshot = await getDocs(
            collection(db, "vehicles")
        );

        availableVehicles = snapshot.docs.map(vehicleDoc => ({
            id: vehicleDoc.id,
            ...vehicleDoc.data()
        }));

        renderVehicles();
        populateVehicleOptions();
        populateDriverOptions();

    } catch (error) {
        console.error("Load vehicles error:", error);
        showEmpty(
            vehiclesContainer,
            "Unable to load vehicles. Check the vehicles Firestore rules."
        );
    }
}


function renderVehicles() {
    if (!vehiclesContainer) return;

    if (availableVehicles.length === 0) {
        showEmpty(vehiclesContainer, "No vehicles registered yet.");
        return;
    }

    vehiclesContainer.innerHTML = "";

    availableVehicles.forEach(vehicle => {
        const card = document.createElement("div");
        card.className = "vehicle-card";

        const driver = vehicle.driverName || "No driver assigned";
        const status = vehicle.status || "inactive";

        card.innerHTML = `
            <h3>
                ${escapeHTML(vehicle.name || "Vehicle")}
                <span class="vehicle-status ${status === "active" ? "status-active" : "status-inactive"}">
                    ${escapeHTML(status)}
                </span>
            </h3>

            <p><strong>Plate:</strong> ${escapeHTML(vehicle.plate || "-")}</p>
            <p><strong>Model:</strong> ${escapeHTML(vehicle.model || "-")}</p>
            <p><strong>Type:</strong> ${escapeHTML(vehicle.type || "-")}</p>
            <p><strong>Driver:</strong> ${escapeHTML(driver)}</p>
            <p><strong>Mileage:</strong> ${Number(vehicle.mileage || 0).toLocaleString()} KM</p>
            <p><strong>Registration expiry:</strong> ${formatDate(vehicle.registrationExpiry)}</p>
            <p><strong>Insurance expiry:</strong> ${formatDate(vehicle.insuranceExpiry)}</p>

            <button type="button" class="edit-vehicle-btn"
                    data-vehicle-id="${escapeHTML(vehicle.id)}">
                Edit Vehicle
            </button>
        `;

        vehiclesContainer.appendChild(card);
    });

    vehiclesContainer.querySelectorAll(".edit-vehicle-btn").forEach(button => {
        button.addEventListener("click", () => {
            editVehicle(button.dataset.vehicleId);
        });
    });
}


// ==========================================
// SAVE VEHICLE
// ==========================================

if (vehicleForm) {
    vehicleForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentSupervisor) {
            showMessage("Supervisor session not ready.", "error");
            return;
        }

        const plate = vehiclePlate.value.trim().toUpperCase();
        const name = vehicleName.value.trim();
        const model = vehicleModel.value.trim();
        const type = vehicleType.value;
        const driverId = vehicleDriver.value;
        const mileage = Number(vehicleMileage.value);
        const status = vehicleStatus.value;

        if (!plate || !name || !type || !Number.isFinite(mileage) || mileage < 0) {
            showMessage("Please complete the required vehicle fields.", "error");
            return;
        }

        const driver = driverId ? getDriverById(driverId) : null;

        if (driverId && !driver) {
            showMessage("Selected driver could not be found. Refresh drivers.", "error");
            return;
        }

        const vehicleData = {
            plate,
            name,
            model,
            type,
            driverId: driver ? getDriverId(driver) : null,
            driverName: driver ? (driver.name || "Unnamed Driver") : null,
            mileage,
            registrationExpiry: vehicleRegistrationExpiry.value || null,
            insuranceExpiry: vehicleInsuranceExpiry.value || null,
            status,
            updatedAt: new Date(),
            updatedByUid: currentSupervisor.uid
        };

        const editingId = vehicleEditId.value;

        saveVehicleButton.disabled = true;

        try {
            if (editingId) {
                await updateDoc(
                    doc(db, "vehicles", editingId),
                    vehicleData
                );

                showMessage("Vehicle updated successfully.");

            } else {
                vehicleData.createdAt = new Date();
                vehicleData.createdByUid = currentSupervisor.uid;

                await addDoc(
                    collection(db, "vehicles"),
                    vehicleData
                );

                showMessage("Vehicle registered successfully.");
            }

            resetVehicleForm();
            await loadVehicles();

        } catch (error) {
            console.error("Save vehicle error:", error);
            showMessage("Unable to save vehicle. Check Firestore rules.", "error");

        } finally {
            saveVehicleButton.disabled = false;
        }
    });
}


// ==========================================
// EDIT VEHICLE
// ==========================================

function editVehicle(vehicleId) {
    const vehicle = getVehicleById(vehicleId);

    if (!vehicle) {
        showMessage("Vehicle not found.", "error");
        return;
    }

    vehicleEditId.value = vehicle.id;
    vehiclePlate.value = vehicle.plate || "";
    vehicleName.value = vehicle.name || "";
    vehicleModel.value = vehicle.model || "";
    vehicleType.value = vehicle.type || "";
    vehicleMileage.value = Number(vehicle.mileage || 0);
    vehicleRegistrationExpiry.value = dateInputValue(vehicle.registrationExpiry);
    vehicleInsuranceExpiry.value = dateInputValue(vehicle.insuranceExpiry);
    vehicleStatus.value = vehicle.status || "active";
    vehicleDriver.value = vehicle.driverId || "";

    saveVehicleButton.textContent = "Update Vehicle";

    vehicleForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    showMessage("Vehicle loaded for editing.");
}


function resetVehicleForm() {
    if (!vehicleForm) return;

    vehicleForm.reset();

    vehicleEditId.value = "";
    vehicleStatus.value = "active";
    saveVehicleButton.textContent = "Save Vehicle";
}


if (cancelVehicleEditButton) {
    cancelVehicleEditButton.addEventListener("click", resetVehicleForm);
}


// ==========================================
// FUEL MANAGEMENT
// ==========================================

if (fuelForm) {
    fuelForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentSupervisor) {
            showMessage("Supervisor session not ready.", "error");
            return;
        }

        const vehicle = getVehicleById(fuelVehicle.value);
        const litres = Number(fuelLitres.value);
        const mileage = Number(fuelMileage.value);

        if (!vehicle) {
            showMessage("Please select a registered vehicle.", "error");
            return;
        }

        if (
            !Number.isFinite(litres) ||
            litres <= 0 ||
            !Number.isFinite(mileage) ||
            mileage < 0 ||
            !fuelDate.value ||
            !fuelType.value
        ) {
            showMessage("Please enter valid fuel information.", "error");
            return;
        }

        const fuelData = {
            vehicleId: vehicle.id,
            vehiclePlate: vehicle.plate || "",
            vehicleName: vehicle.name || "",
            fuelType: fuelType.value,
            litres,
            mileage,
            fuelDate: fuelDate.value,
            notes: fuelNotes.value.trim(),
            createdAt: new Date(),
            createdByUid: currentSupervisor.uid
        };

        const submitButton = fuelForm.querySelector('[type="submit"]');
        submitButton.disabled = true;

        try {
            await addDoc(
                collection(db, "fuelLogs"),
                fuelData
            );

            // Update the vehicle mileage only when the new reading is higher.
            if (mileage > Number(vehicle.mileage || 0)) {
                await updateDoc(
                    doc(db, "vehicles", vehicle.id),
                    {
                        mileage,
                        updatedAt: new Date(),
                        updatedByUid: currentSupervisor.uid
                    }
                );
            }

            fuelForm.reset();
            showMessage("Fuel record saved successfully.");

            await loadVehicles();
            await loadFuelRecords();

        } catch (error) {
            console.error("Save fuel record error:", error);
            showMessage("Unable to save fuel record. Check Firestore rules.", "error");

        } finally {
            submitButton.disabled = false;
        }
    });
}


async function loadFuelRecords() {
    if (!fuelContainer) return;

    showLoading(fuelContainer, "Loading fuel records...");

    try {
        const snapshot = await getDocs(
            collection(db, "fuelLogs")
        );

        const records = snapshot.docs.map(recordDoc => ({
            id: recordDoc.id,
            ...recordDoc.data()
        }));

        records.sort((a, b) =>
            String(b.fuelDate || "").localeCompare(String(a.fuelDate || ""))
        );

        if (records.length === 0) {
            showEmpty(fuelContainer, "No fuel records found.");
            return;
        }

        fuelContainer.innerHTML = "";

        records.forEach(record => {
            const card = document.createElement("div");
            card.className = "fuel-card";

            card.innerHTML = `
                <h3>${escapeHTML(record.vehicleName || "Vehicle")} — ${escapeHTML(record.vehiclePlate || "-")}</h3>
                <p><strong>Fuel type:</strong> ${escapeHTML(record.fuelType || "-")}</p>
                <p><strong>Quantity:</strong> ${Number(record.litres || 0).toFixed(2)} litres</p>
                <p><strong>Mileage:</strong> ${Number(record.mileage || 0).toLocaleString()} KM</p>
                <p><strong>Date:</strong> ${formatDate(record.fuelDate)}</p>
                <p><strong>Notes:</strong> ${escapeHTML(record.notes || "-")}</p>
            `;

            fuelContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Load fuel records error:", error);
        showEmpty(fuelContainer, "Unable to load fuel records. Check Firestore rules.");
    }
}


// ==========================================
// MAINTENANCE MANAGEMENT
// ==========================================

if (maintenanceForm) {
    maintenanceForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentSupervisor) {
            showMessage("Supervisor session not ready.", "error");
            return;
        }

        const vehicle = getVehicleById(maintenanceVehicle.value);
        const mileage = Number(maintenanceMileage.value);
        const quantityValue = maintenanceQuantity.value;
        const nextMileageValue = maintenanceNextMileage.value;

        if (!vehicle) {
            showMessage("Please select a registered vehicle.", "error");
            return;
        }

        if (
            !maintenanceType.value ||
            !maintenanceDate.value ||
            !Number.isFinite(mileage) ||
            mileage < 0
        ) {
            showMessage("Please complete the required maintenance fields.", "error");
            return;
        }

        const maintenanceData = {
            vehicleId: vehicle.id,
            vehiclePlate: vehicle.plate || "",
            vehicleName: vehicle.name || "",
            maintenanceType: maintenanceType.value,
            serviceDate: maintenanceDate.value,
            mileage,
            fluidType: maintenanceFluidType.value.trim(),
            quantity: quantityValue === "" ? null : Number(quantityValue),
            nextServiceDate: maintenanceNextDate.value || null,
            nextServiceMileage: nextMileageValue === "" ? null : Number(nextMileageValue),
            description: maintenanceDescription.value.trim(),
            createdAt: new Date(),
            createdByUid: currentSupervisor.uid
        };

        if (
            maintenanceData.quantity !== null &&
            (!Number.isFinite(maintenanceData.quantity) || maintenanceData.quantity < 0)
        ) {
            showMessage("Please enter a valid maintenance quantity.", "error");
            return;
        }

        if (
            maintenanceData.nextServiceMileage !== null &&
            (!Number.isFinite(maintenanceData.nextServiceMileage) ||
                maintenanceData.nextServiceMileage < 0)
        ) {
            showMessage("Please enter a valid next service mileage.", "error");
            return;
        }

        const submitButton = maintenanceForm.querySelector('[type="submit"]');
        submitButton.disabled = true;

        try {
            await addDoc(
                collection(db, "maintenanceLogs"),
                maintenanceData
            );
console.log("STEP 1: Maintenance record saved successfully.");
            if (mileage > Number(vehicle.mileage || 0)) {
                await updateDoc(
                    doc(db, "vehicles", vehicle.id),
                    {
                        mileage,
                        updatedAt: new Date(),
                        updatedByUid: currentSupervisor.uid
                    }
                );
            }

            maintenanceForm.reset();

            showMessage("Maintenance record saved successfully.");

            await loadVehicles();
            await loadMaintenanceRecords();

        } catch (error) {
            console.error("Save maintenance error:", error);
            showMessage("Unable to save maintenance record. Check Firestore rules.", "error");

        } finally {
            submitButton.disabled = false;
        }
    });
}


// ==========================================
// LOAD MAINTENANCE HISTORY
// ==========================================

async function loadMaintenanceRecords() {
    if (!maintenanceContainer) return;

    showLoading(maintenanceContainer, "Loading maintenance records...");

    try {
        const snapshot = await getDocs(
            collection(db, "maintenanceLogs")
        );

        maintenanceRecords = snapshot.docs.map(recordDoc => ({
            id: recordDoc.id,
            ...recordDoc.data()
        }));

        maintenanceRecords.sort((a, b) =>
            String(b.serviceDate || "").localeCompare(String(a.serviceDate || ""))
        );

        renderMaintenanceRecords();
        renderServiceReminders();

    } catch (error) {
        console.error("Load maintenance records error:", error);

        showEmpty(
            maintenanceContainer,
            "Unable to load maintenance records. Check Firestore rules."
        );

        if (serviceRemindersContainer) {
            showEmpty(serviceRemindersContainer, "Unable to load service reminders.");
        }
    }
}


function renderMaintenanceRecords() {
    if (!maintenanceContainer) return;

    if (maintenanceRecords.length === 0) {
        showEmpty(maintenanceContainer, "No maintenance records found.");
        return;
    }

    maintenanceContainer.innerHTML = "";

    maintenanceRecords.forEach(record => {
        const card = document.createElement("div");
        card.className = "maintenance-card";

        card.innerHTML = `
            <h3>${escapeHTML(record.maintenanceType || "Maintenance")}</h3>

            <p>
                <strong>Vehicle:</strong>
                ${escapeHTML(record.vehicleName || "Vehicle")}
                — ${escapeHTML(record.vehiclePlate || "-")}
            </p>

            <p><strong>Service date:</strong> ${formatDate(record.serviceDate)}</p>
            <p><strong>Mileage:</strong> ${Number(record.mileage || 0).toLocaleString()} KM</p>
            <p><strong>Oil / fluid type:</strong> ${escapeHTML(record.fluidType || "-")}</p>
            <p><strong>Quantity:</strong> ${record.quantity == null ? "-" : Number(record.quantity).toFixed(2) + " litres"}</p>
            <p><strong>Next service date:</strong> ${formatDate(record.nextServiceDate)}</p>
            <p><strong>Next service mileage:</strong> ${record.nextServiceMileage == null ? "-" : Number(record.nextServiceMileage).toLocaleString() + " KM"}</p>
            <p><strong>Description:</strong> ${escapeHTML(record.description || "-")}</p>
        `;

        maintenanceContainer.appendChild(card);
    });
}


// ==========================================
// SERVICE REMINDERS
// ==========================================

function renderServiceReminders() {
    if (!serviceRemindersContainer) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminders = [];

    maintenanceRecords.forEach(record => {
        const vehicle = getVehicleById(record.vehicleId);

        if (!vehicle || vehicle.status !== "active") return;

        const nextDate = record.nextServiceDate
            ? new Date(`${record.nextServiceDate}T00:00:00`)
            : null;

        const nextMileage = record.nextServiceMileage != null
            ? Number(record.nextServiceMileage)
            : null;

        const currentMileage = Number(vehicle.mileage || 0);

        let overdue = false;
        let upcoming = false;
        const reasons = [];

        if (nextDate && !Number.isNaN(nextDate.getTime())) {
            const daysRemaining = Math.ceil(
                (nextDate.getTime() - today.getTime()) / 86400000
            );

            if (daysRemaining < 0) {
                overdue = true;
                reasons.push(`Date overdue by ${Math.abs(daysRemaining)} day(s)`);
            } else if (daysRemaining <= 30) {
                upcoming = true;
                reasons.push(`Due in ${daysRemaining} day(s)`);
            }
        }

        if (nextMileage !== null && Number.isFinite(nextMileage)) {
            const kmRemaining = nextMileage - currentMileage;

            if (kmRemaining < 0) {
                overdue = true;
                reasons.push(`Mileage overdue by ${Math.abs(kmRemaining).toLocaleString()} KM`);
            } else if (kmRemaining <= 1000) {
                upcoming = true;
                reasons.push(`${kmRemaining.toLocaleString()} KM remaining`);
            }
        }

        if (overdue || upcoming) {
            reminders.push({
                record,
                vehicle,
                overdue,
                reasons
            });
        }
    });

    if (reminders.length === 0) {
        showEmpty(
            serviceRemindersContainer,
            "No upcoming or overdue services. Your vehicles are up to date based on recorded schedules."
        );
        return;
    }

    reminders.sort((a, b) => Number(b.overdue) - Number(a.overdue));

    serviceRemindersContainer.innerHTML = "";

    reminders.forEach(item => {
        const card = document.createElement("div");

        card.className =
            `reminder-card ${item.overdue ? "overdue" : "upcoming"}`;

        card.innerHTML = `
            <h3>
                ${escapeHTML(item.record.maintenanceType || "Vehicle Service")}

                <span class="reminder-status ${item.overdue ? "status-overdue" : "status-upcoming"}">
                    ${item.overdue ? "OVERDUE" : "UPCOMING"}
                </span>
            </h3>

            <p>
                <strong>Vehicle:</strong>
                ${escapeHTML(getVehicleName(item.vehicle))}
            </p>

            <p>
                <strong>Reminder:</strong>
                ${escapeHTML(item.reasons.join(" • "))}
            </p>

            <p>
                <strong>Next date:</strong>
                ${formatDate(item.record.nextServiceDate)}
            </p>

            <p>
                <strong>Next mileage:</strong>
                ${item.record.nextServiceMileage == null
                    ? "-"
                    : Number(item.record.nextServiceMileage).toLocaleString() + " KM"}
            </p>
        `;

        serviceRemindersContainer.appendChild(card);
    });
}


// ==========================================
// REFRESH BUTTONS
// ==========================================

if (refreshDriversButton) {
    refreshDriversButton.addEventListener("click", async () => {
        await loadDrivers();
        await loadOrders();
    });
}

if (refreshOrdersButton) {
    refreshOrdersButton.addEventListener("click", loadOrders);
}

if (refreshVehiclesButton) {
    refreshVehiclesButton.addEventListener("click", async () => {
        await loadVehicles();
        showMessage("Vehicle list refreshed.");
    });
}

if (refreshFuelButton) {
    refreshFuelButton.addEventListener("click", async () => {
        await loadFuelRecords();
        showMessage("Fuel records refreshed.");
    });
}

if (refreshMaintenanceButton) {
    refreshMaintenanceButton.addEventListener("click", async () => {
        await loadMaintenanceRecords();
        showMessage("Maintenance records refreshed.");
    });
}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {
    showMessage("Loading Supervisor Dashboard...");

    await loadDrivers();
    await loadOrders();
    await loadVehicles();
    await loadFuelRecords();
    await loadMaintenanceRecords();

    showMessage("Supervisor Dashboard ready.");
}


// ==========================================
// LOGOUT
// ==========================================

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "index.html";

        } catch (error) {
            console.error("Logout error:", error);
            showMessage("Unable to log out.", "error");
        }
    });
}


// ==========================================
// AUTH CHECK
// ==========================================

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const isSupervisor = await verifySupervisor(user);

    if (!isSupervisor) {
        alert(
            "Access denied. Please use an active supervisor account."
        );

        window.location.href = "index.html";
        return;
    }

    if (supervisorName) {
        supervisorName.textContent =
            currentSupervisor.name ||
            user.email ||
            "Supervisor";
    }

    console.log("Supervisor verified:", user.email);
    console.log("SUPERVISOR UID CHECK:", user.uid);

    await loadDashboard();
});
