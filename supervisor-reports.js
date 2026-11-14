
import { db, auth } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// PAGE ELEMENTS
const supervisorName = document.getElementById("supervisor-name");
const logoutButton = document.getElementById("logout-btn");
const supervisorMessage = document.getElementById("supervisor-message");
const reportsContainer = document.getElementById("reports-container");

// REPORT DATA
let allOrders = [];
let allDrivers = [];
let allVehicles = [];
let allFuelLogs = [];
let allMaintenanceLogs = [];

// HELPERS
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getDate(value) {
    if (!value) return null;

    if (value.toDate && typeof value.toDate === "function") {
        return value.toDate();
    }

    if (value instanceof Date) {
        return value;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
    const date = getDate(value);
    return date ? date.toLocaleDateString() : "Not available";
}

function showMessage(message) {
    if (supervisorMessage) {
        supervisorMessage.textContent = message;
    }
}

function normalizeStatus(status) {
    return String(status || "Pending").trim().toLowerCase();
}

function isDelivered(order) {
    return normalizeStatus(order.status) === "delivered";
}

function isDelayed(order) {
    return normalizeStatus(order.status) === "delivery delayed";
}

function isActiveVehicle(vehicle) {
    return String(vehicle.status || "").trim().toLowerCase() === "active";
}

function numberValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function makeStat(label, value, description = "") {
    return `
        <div class="report-stat">
            <span>${escapeHTML(label)}</span>
            <strong>${escapeHTML(value)}</strong>
            ${description ? `<small>${escapeHTML(description)}</small>` : ""}
        </div>
    `;
}

function makeBar(label, value, maximum) {
    const percentage = maximum > 0
        ? Math.min(100, (value / maximum) * 100)
        : 0;

    return `
        <div class="report-bar-row">
            <span class="report-bar-label">${escapeHTML(label)}</span>
            <div class="report-bar-track">
                <div class="report-bar-fill"
                     style="width:${percentage}%"></div>
            </div>
            <span class="report-bar-value">${value}</span>
        </div>
    `;
}

function makeTable(headers, rows) {
    if (!rows.length) {
        return `<div class="report-empty">No records available.</div>`;
    }

    return `
        <div class="report-table-wrap">
            <table class="report-table">
                <thead>
                    <tr>${headers.map(header =>
                        `<th>${escapeHTML(header)}</th>`
                    ).join("")}</tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            ${row.map(cell => `<td>${cell}</td>`).join("")}
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function statusBadge(status, type = "") {
    return `<span class="report-status ${type}">${escapeHTML(status)}</span>`;
}

function daysUntil(value) {
    const date = getDate(value);
    if (!date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    date.setHours(0, 0, 0, 0);

    return Math.ceil((date - today) / 86400000);
}

// LOAD DATA
async function loadOrders() {
    const snapshot = await getDocs(collection(db, "orders"));

    allOrders = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
    }));
}

async function loadDrivers() {
    const driversQuery = query(
        collection(db, "users"),
        where("role", "==", "driver")
    );

    const snapshot = await getDocs(driversQuery);

    allDrivers = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
    }));
}

async function loadVehicles() {
    const snapshot = await getDocs(collection(db, "vehicles"));

    allVehicles = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
    }));
}

async function loadFuelLogs() {
    const snapshot = await getDocs(collection(db, "fuelLogs"));

    allFuelLogs = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
    }));
}

async function loadMaintenanceLogs() {
    const snapshot = await getDocs(collection(db, "maintenanceLogs"));

    allMaintenanceLogs = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
    }));
}

// DELIVERY REPORTS
function renderDeliveryReports() {
    const total = allOrders.length;

    const pending = allOrders.filter(order =>
        !order.status || normalizeStatus(order.status) === "pending"
    ).length;

    const processing = allOrders.filter(order =>
        normalizeStatus(order.status) === "processing"
    ).length;

    const outForDelivery = allOrders.filter(order =>
        normalizeStatus(order.status) === "out for delivery"
    ).length;

    const shipped = allOrders.filter(order =>
        normalizeStatus(order.status) === "shipped"
    ).length;

    const delivered = allOrders.filter(isDelivered).length;
    const delayed = allOrders.filter(isDelayed).length;

    const unassigned = allOrders.filter(order =>
        !order.assignedDriverId
    );

    const successRate = total > 0
        ? ((delivered / total) * 100).toFixed(1)
        : "0.0";

    const statuses = [
        ["Pending", pending],
        ["Processing", processing],
        ["Shipped", shipped],
        ["Out for Delivery", outForDelivery],
        ["Delivered", delivered],
        ["Delayed", delayed]
    ];

    const maximum = Math.max(1, ...statuses.map(item => item[1]));

    const unassignedRows = unassigned.map(order => [
        escapeHTML(order.id),
        escapeHTML(order.customerName || order.name || "Customer"),
        statusBadge(order.status || "Pending", "warning")
    ]);

    return `
        <section class="report-card full-width">
            <div class="report-section-heading">
                <h3>Delivery Performance</h3>
            </div>

            <div class="report-stat-grid">
                ${makeStat("Total Orders", total)}
                ${makeStat("Pending", pending)}
                ${makeStat("Out for Delivery", outForDelivery)}
                ${makeStat("Delivered", delivered)}
                ${makeStat("Delayed", delayed)}
                ${makeStat("Unassigned Orders", unassigned.length)}
                ${makeStat("Success Rate", successRate + "%")}
            </div>
        </section>

        <section class="report-card">
            <h3>Order Status Distribution</h3>
            <div class="report-chart">
                ${statuses.map(([label, value]) =>
                    makeBar(label, value, maximum)
                ).join("")}
            </div>
        </section>

        <section class="report-card">
            <h3>Orders Awaiting Driver Assignment</h3>
            ${makeTable(
                ["Order ID", "Customer", "Status"],
                unassignedRows
            )}
        </section>

        <section class="report-card full-width">
            <h3>Daily Delivery Statistics</h3>
            ${renderDailyStatistics()}
            <p class="report-note">
                Uses the available last status update date for delivered
                orders, not a complete history of every status change.
            </p>
        </section>

        <section class="report-card full-width">
            <h3>Monthly Delivery Statistics</h3>
            ${renderMonthlyStatistics()}
            <p class="report-note">
                Monthly figures also use the available last status update date.
            </p>
        </section>
    `;
}

// DRIVER REPORTS
function renderDriverReports() {
    const activeDrivers = allDrivers.filter(driver =>
        driver.active === true
    ).length;

    const rows = allDrivers.map(driver => {
        const driverId = String(driver.uid || driver.id);

        const assigned = allOrders.filter(order =>
            String(order.assignedDriverId || "") === driverId
        );

        const delivered = assigned.filter(isDelivered).length;
        const outstanding = assigned.length - delivered;

        return [
            `<strong>${escapeHTML(driver.name || "Unnamed Driver")}</strong>
             <br><small>${escapeHTML(driver.email || "No email")}</small>`,
            assigned.length,
            delivered,
            outstanding,
            statusBadge(
                driver.active === true ? "Active" : "Inactive",
                driver.active === true ? "good" : "danger"
            )
        ];
    });

    const driverStats = allDrivers.map(driver => {
        const driverId = String(driver.uid || driver.id);

        return {
            name: driver.name || "Driver",
            delivered: allOrders.filter(order =>
                String(order.assignedDriverId || "") === driverId &&
                isDelivered(order)
            ).length
        };
    });

    const maximum = Math.max(
        1,
        ...driverStats.map(driver => driver.delivered)
    );

    return `
        <section class="report-card full-width">
            <h3>Driver Overview</h3>
            <div class="report-stat-grid">
                ${makeStat("Registered Drivers", allDrivers.length)}
                ${makeStat("Active Drivers", activeDrivers)}
                ${makeStat("Inactive Drivers", allDrivers.length - activeDrivers)}
            </div>
        </section>

        <section class="report-card">
            <h3>Driver Delivery Performance</h3>
            ${
                driverStats.length
                    ? `<div class="report-chart">
                        ${driverStats.map(driver =>
                            makeBar(driver.name, driver.delivered, maximum)
                        ).join("")}
                       </div>`
                    : `<div class="report-empty">No drivers found.</div>`
            }
        </section>

        <section class="report-card">
            <h3>Driver Performance Details</h3>
            ${makeTable(
                ["Driver", "Assigned", "Delivered", "Outstanding", "Status"],
                rows
            )}
        </section>
    `;
}

// DAILY STATISTICS
function renderDailyStatistics() {
    const dailyData = {};

    allOrders.filter(isDelivered).forEach(order => {
        const date = getDate(order.statusUpdatedAt);
        if (!date) return;

        const key = date.toLocaleDateString();
        dailyData[key] = (dailyData[key] || 0) + 1;
    });

    const entries = Object.entries(dailyData);

    if (!entries.length) {
        return `<div class="report-empty">No daily delivery data available.</div>`;
    }

    return makeTable(
        ["Date", "Delivered Orders"],
        entries.map(([date, count]) => [
            escapeHTML(date),
            count
        ])
    );
}

// MONTHLY STATISTICS
function renderMonthlyStatistics() {
    const monthlyData = {};

    allOrders.filter(isDelivered).forEach(order => {
        const date = getDate(order.statusUpdatedAt);
        if (!date) return;

        const key = `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}`;

        monthlyData[key] = (monthlyData[key] || 0) + 1;
    });

    const entries = Object.entries(monthlyData).sort((a, b) =>
        b[0].localeCompare(a[0])
    );

    if (!entries.length) {
        return `<div class="report-empty">No monthly delivery data available.</div>`;
    }

    return makeTable(
        ["Month", "Delivered Orders"],
        entries.map(([month, count]) => {
            const [year, monthNumber] = month.split("-");

            const monthName = new Date(
                Number(year),
                Number(monthNumber) - 1
            ).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric"
            });

            return [escapeHTML(monthName), count];
        })
    );
}

// FLEET REPORTS
function renderFleetReports() {
    const active = allVehicles.filter(isActiveVehicle).length;
    const inactive = allVehicles.length - active;

    const expiryWarnings = [];

    allVehicles.forEach(vehicle => {
        [
            ["Registration", vehicle.registrationExpiry],
            ["Insurance", vehicle.insuranceExpiry]
        ].forEach(([type, date]) => {
            const remaining = daysUntil(date);

            if (remaining !== null && remaining <= 30) {
                expiryWarnings.push({
                    vehicle,
                    type,
                    date,
                    remaining
                });
            }
        });
    });

    const vehicleRows = allVehicles.map(vehicle => [
        escapeHTML(vehicle.plate || "Not available"),
        escapeHTML(vehicle.name || vehicle.model || "Vehicle"),
        escapeHTML(vehicle.assignedDriverName || "Unassigned"),
        escapeHTML(vehicle.mileage ?? "Not available"),
        statusBadge(
            vehicle.status || "Unknown",
            isActiveVehicle(vehicle) ? "good" : "warning"
        )
    ]);

    const warningRows = expiryWarnings.map(item => [
        escapeHTML(item.vehicle.plate || "Vehicle"),
        escapeHTML(item.type),
        formatDate(item.date),
        item.remaining < 0
            ? statusBadge("Expired", "danger")
            : statusBadge(`${item.remaining} days left`, "warning")
    ]);

    return `
        <section class="report-card full-width">
            <h3>Fleet Overview</h3>
            <div class="report-stat-grid">
                ${makeStat("Registered Vehicles", allVehicles.length)}
                ${makeStat("Active Vehicles", active)}
                ${makeStat("Inactive Vehicles", inactive)}
                ${makeStat("Expiry Warnings", expiryWarnings.length)}
            </div>
        </section>

        <section class="report-card full-width">
            <h3>Vehicle Registration</h3>
            ${makeTable(
                ["Plate", "Vehicle", "Assigned Driver", "Mileage (km)", "Status"],
                vehicleRows
            )}
        </section>

        <section class="report-card full-width">
            <h3>Registration and Insurance Warnings</h3>
            ${makeTable(
                ["Vehicle", "Document", "Expiry Date", "Reminder"],
                warningRows
            )}
            <p class="report-note">
                Shows expired documents and documents due within 30 days.
            </p>
        </section>
    `;
}

// FUEL REPORTS
function renderFuelReports() {
    const totalLitres = allFuelLogs.reduce((sum, log) =>
        sum + numberValue(log.litres), 0
    );

    const fuelTypes = {};

    allFuelLogs.forEach(log => {
        const type = String(log.fuelType || "Other");
        fuelTypes[type] = (fuelTypes[type] || 0) +
            numberValue(log.litres);
    });

    const fuelEntries = Object.entries(fuelTypes);
    const maximum = Math.max(
        1,
        ...fuelEntries.map(item => item[1])
    );

    const monthly = {};

    allFuelLogs.forEach(log => {
        const date = getDate(log.fuelDate || log.createdAt);
        if (!date) return;

        const key = `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}`;

        monthly[key] = (monthly[key] || 0) +
            numberValue(log.litres);
    });

    const monthlyRows = Object.entries(monthly)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, litres]) => {
            const [year, monthNumber] = month.split("-");

            const name = new Date(
                Number(year),
                Number(monthNumber) - 1
            ).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric"
            });

            return [escapeHTML(name), litres.toFixed(2) + " L"];
        });

    const recentRows = [...allFuelLogs]
        .sort((a, b) =>
            (getDate(b.fuelDate || b.createdAt)?.getTime() || 0) -
            (getDate(a.fuelDate || a.createdAt)?.getTime() || 0)
        )
        .slice(0, 20)
        .map(log => [
            escapeHTML(log.vehiclePlate || log.vehicleName || "Vehicle"),
            escapeHTML(log.fuelType || "Other"),
            numberValue(log.litres).toFixed(2) + " L",
            formatDate(log.fuelDate || log.createdAt),
            escapeHTML(log.mileage ?? "Not available")
        ]);

    return `
        <section class="report-card full-width">
            <h3>Fuel Consumption Overview</h3>
            <div class="report-stat-grid">
                ${makeStat("Fuel Records", allFuelLogs.length)}
                ${makeStat("Total Fuel Used", totalLitres.toFixed(2) + " L")}
                ${makeStat("Fuel Types", fuelEntries.length)}
            </div>
        </section>

        <section class="report-card">
            <h3>Consumption by Fuel Type</h3>
            ${
                fuelEntries.length
                    ? `<div class="report-chart">
                        ${fuelEntries.map(([type, litres]) =>
                            makeBar(type, Number(litres.toFixed(2)), maximum)
                        ).join("")}
                       </div>`
                    : `<div class="report-empty">No fuel records available.</div>`
            }
        </section>

        <section class="report-card">
            <h3>Monthly Fuel Consumption</h3>
            ${makeTable(["Month", "Litres Used"], monthlyRows)}
        </section>

        <section class="report-card full-width">
            <h3>Recent Fuel Records</h3>
            ${makeTable(
                ["Vehicle", "Fuel Type", "Litres", "Date", "Mileage"],
                recentRows
            )}
            <p class="report-note">
                Fuel reports show consumption quantities only.
                Financial costs are not displayed in the Supervisor Portal.
            </p>
        </section>
    `;
}

// MAINTENANCE REPORTS
function renderMaintenanceReports() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminders = [];

    allVehicles.forEach(vehicle => {
        const nextDate = getDate(vehicle.nextServiceDate);
        const nextMileage = numberValue(vehicle.nextServiceMileage);
        const currentMileage = numberValue(vehicle.mileage);

        if (nextDate) {
            const remaining = daysUntil(nextDate);

            if (remaining !== null && remaining <= 30) {
                reminders.push({
                    vehicle,
                    reason: remaining < 0
                        ? "Service overdue"
                        : `Service in ${remaining} days`,
                    type: remaining < 0 ? "danger" : "warning"
                });
            }
        }

        if (nextMileage > 0 && currentMileage > 0) {
            const remainingKm = nextMileage - currentMileage;

            if (remainingKm <= 1000) {
                reminders.push({
                    vehicle,
                    reason: remainingKm < 0
                        ? "Mileage overdue"
                        : `${remainingKm} km remaining`,
                    type: remainingKm < 0 ? "danger" : "warning"
                });
            }
        }
    });

    allMaintenanceLogs.forEach(log => {
        const remaining = daysUntil(log.nextServiceDate);

        if (remaining !== null && remaining <= 30) {
            reminders.push({
                vehicle: {
                    plate: log.vehiclePlate || log.vehicleName || "Vehicle"
                },
                reason: remaining < 0
                    ? "Service overdue"
                    : `Service in ${remaining} days`,
                type: remaining < 0 ? "danger" : "warning"
            });
        }
    });

    const reminderRows = reminders.map(item => [
        escapeHTML(item.vehicle.plate || item.vehicle.name || "Vehicle"),
        escapeHTML(item.reason),
        statusBadge(
            item.type === "danger" ? "Overdue" : "Upcoming",
            item.type
        )
    ]);

    const historyRows = [...allMaintenanceLogs]
        .sort((a, b) =>
            (getDate(b.serviceDate || b.createdAt)?.getTime() || 0) -
            (getDate(a.serviceDate || a.createdAt)?.getTime() || 0)
        )
        .slice(0, 30)
        .map(log => [
            escapeHTML(log.vehiclePlate || log.vehicleName || "Vehicle"),
            escapeHTML(log.maintenanceType || "General Service"),
            formatDate(log.serviceDate || log.createdAt),
            escapeHTML(log.description || "No description")
        ]);

    const types = {};

    allMaintenanceLogs.forEach(log => {
        const type = String(log.maintenanceType || "Other");
        types[type] = (types[type] || 0) + 1;
    });

    const typeEntries = Object.entries(types);
    const maximum = Math.max(1, ...typeEntries.map(item => item[1]));

    return `
        <section class="report-card full-width">
            <h3>Maintenance Overview</h3>
            <div class="report-stat-grid">
                ${makeStat("Maintenance Records", allMaintenanceLogs.length)}
                ${makeStat("Service Reminders", reminders.length)}
                ${makeStat("Maintenance Types", typeEntries.length)}
            </div>
        </section>

        <section class="report-card">
            <h3>Maintenance by Type</h3>
            ${
                typeEntries.length
                    ? `<div class="report-chart">
                        ${typeEntries.map(([type, count]) =>
                            makeBar(type, count, maximum)
                        ).join("")}
                       </div>`
                    : `<div class="report-empty">No maintenance records available.</div>`
            }
        </section>

        <section class="report-card">
            <h3>Upcoming and Overdue Services</h3>
            ${makeTable(
                ["Vehicle", "Reminder", "Status"],
                reminderRows
            )}
        </section>

        <section class="report-card full-width">
            <h3>Maintenance History</h3>
            ${makeTable(
                ["Vehicle", "Service Type", "Date", "Description"],
                historyRows
            )}
        </section>
    `;
}

// DISPLAY ALL REPORTS
function renderReports() {
    reportsContainer.innerHTML = `
        <div class="report-card full-width">
            <div class="report-section-heading">
                <h3>BARQ Operations Reports</h3>
                <button type="button"
                        class="report-refresh-btn"
                        id="refresh-reports-btn">
                    Refresh Reports
                </button>
            </div>
            <p class="report-subtitle">
                Delivery, drivers, fleet, fuel and maintenance performance
            </p>
        </div>

        ${renderDeliveryReports()}
        ${renderDriverReports()}
        ${renderFleetReports()}
        ${renderFuelReports()}
        ${renderMaintenanceReports()}
    `;

    const refreshButton = document.getElementById("refresh-reports-btn");

    if (refreshButton) {
        refreshButton.addEventListener("click", refreshReports);
    }
}

// REFRESH REPORTS
async function refreshReports() {
    try {
        showMessage("Loading all reports...");

        await Promise.all([
            loadOrders(),
            loadDrivers(),
            loadVehicles(),
            loadFuelLogs(),
            loadMaintenanceLogs()
        ]);

        renderReports();

        showMessage("All reports updated successfully.");

    } catch (error) {
        console.error("Reports loading error:", error);
        showMessage("Unable to load reports. Please check the database and try again.");
    }
}

// VERIFY SUPERVISOR
async function verifySupervisor(user) {
    if (!user) return false;

    const supervisorQuery = query(
        collection(db, "users"),
        where("uid", "==", user.uid)
    );

    const snapshot = await getDocs(supervisorQuery);

    if (snapshot.empty) return false;

    const supervisorData = snapshot.docs[0].data();

    if (
        String(supervisorData.role || "").toLowerCase() !== "supervisor" ||
        supervisorData.active !== true
    ) {
        return false;
    }

    return supervisorData;
}

// LOGOUT
if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            console.error("Logout error:", error);
            showMessage("Unable to log out. Please try again.");
        }
    });
}

// CHECK SUPERVISOR LOGIN
onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {
        const supervisorData = await verifySupervisor(user);

        if (!supervisorData) {
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }

        if (supervisorName) {
            supervisorName.textContent =
                supervisorData.name ||
                user.displayName ||
                user.email ||
                "Supervisor";
        }

        await refreshReports();

    } catch (error) {
        console.error("Supervisor authentication error:", error);
        showMessage("Unable to verify supervisor account. Please try again.");
    }
});
