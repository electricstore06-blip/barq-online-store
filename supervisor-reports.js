
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

let allOrders = [];
let allDrivers = [];

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

    if (!date) return "Not available";

    return date.toLocaleDateString();
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

// LOAD ORDERS
async function loadOrders() {
    const snapshot = await getDocs(collection(db, "orders"));

    allOrders = snapshot.docs.map(orderDoc => ({
        id: orderDoc.id,
        ...orderDoc.data()
    }));
}

// LOAD DRIVERS
async function loadDrivers() {
    const driversQuery = query(
        collection(db, "users"),
        where("role", "==", "driver")
    );

    const snapshot = await getDocs(driversQuery);

    allDrivers = snapshot.docs.map(driverDoc => ({
        id: driverDoc.id,
        ...driverDoc.data()
    }));
}

// ORDER SUMMARY
function renderOrderSummary() {
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

    const delivered = allOrders.filter(isDelivered).length;

    const delayed = allOrders.filter(isDelayed).length;

    const successRate = total > 0
        ? ((delivered / total) * 100).toFixed(1)
        : "0.0";

    return `
        <div class="report-summary-grid">

            <div class="report-card">
                <h3>Total Orders</h3>
                <p>${total}</p>
            </div>

            <div class="report-card">
                <h3>Pending</h3>
                <p>${pending}</p>
            </div>

            <div class="report-card">
                <h3>Processing</h3>
                <p>${processing}</p>
            </div>

            <div class="report-card">
                <h3>Out for Delivery</h3>
                <p>${outForDelivery}</p>
            </div>

            <div class="report-card">
                <h3>Delivered</h3>
                <p>${delivered}</p>
            </div>

            <div class="report-card">
                <h3>Delayed</h3>
                <p>${delayed}</p>
            </div>

            <div class="report-card">
                <h3>Delivery Success Rate</h3>
                <p>${successRate}%</p>
            </div>

        </div>
    `;
}

// DRIVER PERFORMANCE
function renderDriverPerformance() {
    if (allDrivers.length === 0) {
        return `
            <p>No drivers found in the database.</p>
        `;
    }

    const rows = allDrivers.map(driver => {
        const driverId = String(driver.uid || driver.id);

        const assignedOrders = allOrders.filter(order =>
            String(order.assignedDriverId || "") === driverId
        );

        const deliveredOrders = assignedOrders.filter(isDelivered);

        const driverName = escapeHTML(driver.name || "Unnamed Driver");

        const driverEmail = escapeHTML(driver.email || "No email");

        const activeStatus = driver.active === true
            ? "Active"
            : "Inactive";

        return `
            <tr>
                <td>
                    <strong>${driverName}</strong><br>
                    <small>${driverEmail}</small>
                </td>
                <td>${assignedOrders.length}</td>
                <td>${deliveredOrders.length}</td>
                <td>${assignedOrders.length - deliveredOrders.length}</td>
                <td>${activeStatus}</td>
            </tr>
        `;
    }).join("");

    return `
        <div class="report-table-wrapper">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Driver</th>
                        <th>Assigned Orders</th>
                        <th>Delivered</th>
                        <th>Not Delivered</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// DAILY DELIVERY STATISTICS
function renderDailyStatistics() {
    const dailyData = {};

    allOrders.filter(isDelivered).forEach(order => {
        const date = getDate(order.statusUpdatedAt);

        if (!date) return;

        const key = date.toLocaleDateString();

        dailyData[key] = (dailyData[key] || 0) + 1;
    });

    const entries = Object.entries(dailyData)
        .sort((a, b) => {
            return new Date(b[0]) - new Date(a[0]);
        });

    if (entries.length === 0) {
        return "<p>No delivered orders with an available update date.</p>";
    }

    return `
        <div class="report-table-wrapper">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Delivered Orders</th>
                    </tr>
                </thead>

                <tbody>
                    ${entries.map(([date, count]) => `
                        <tr>
                            <td>${escapeHTML(date)}</td>
                            <td>${count}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

// MONTHLY DELIVERY STATISTICS
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

    const entries = Object.entries(monthlyData)
        .sort((a, b) => b[0].localeCompare(a[0]));

    if (entries.length === 0) {
        return "<p>No monthly delivery data available.</p>";
    }

    return `
        <div class="report-table-wrapper">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Delivered Orders</th>
                    </tr>
                </thead>

                <tbody>
                    ${entries.map(([month, count]) => {
                        const [year, monthNumber] = month.split("-");

                        const monthName = new Date(
                            Number(year),
                            Number(monthNumber) - 1
                        ).toLocaleDateString(undefined, {
                            month: "long",
                            year: "numeric"
                        });

                        return `
                            <tr>
                                <td>${escapeHTML(monthName)}</td>
                                <td>${count}</td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;
}

// DISPLAY ALL REPORTS
function renderReports() {
    reportsContainer.innerHTML = `
        <div class="reports-heading">
            <h3>Order Summary</h3>
        </div>

        ${renderOrderSummary()}

        <section class="report-section">
            <h3>Driver Performance</h3>
            ${renderDriverPerformance()}
        </section>

        <section class="report-section">
            <h3>Daily Delivery Statistics</h3>
            ${renderDailyStatistics()}
        </section>

        <section class="report-section">
            <h3>Monthly Delivery Statistics</h3>
            ${renderMonthlyStatistics()}
        </section>

        <p class="report-note">
            Daily and monthly delivery statistics use the available
            last status update date of delivered orders. They do not
            represent a complete history of every status change.
        </p>

        <button type="button" id="refresh-reports-btn">
            Refresh Reports
        </button>
    `;

    const refreshButton = document.getElementById("refresh-reports-btn");

    refreshButton.addEventListener("click", refreshReports);
}

// REFRESH REPORTS
async function refreshReports() {
    try {
        showMessage("Refreshing reports...");

        await Promise.all([
            loadOrders(),
            loadDrivers()
        ]);

        renderReports();

        showMessage("Reports updated successfully.");

    } catch (error) {
        console.error("Reports loading error:", error);
        showMessage("Unable to refresh reports. Please try again.");
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
