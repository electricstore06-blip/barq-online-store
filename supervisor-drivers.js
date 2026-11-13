
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
const driversContainer = document.getElementById("drivers-container");
const refreshDriversButton = document.getElementById("refresh-drivers-btn");
const logoutButton = document.getElementById("logout-btn");
const supervisorMessage = document.getElementById("supervisor-message");

let currentSupervisor = null;
let availableDrivers = [];

// SHOW MESSAGE
function showMessage(message) {
    if (supervisorMessage) {
        supervisorMessage.textContent = message;
    }
}

// VERIFY SUPERVISOR ACCOUNT
async function verifySupervisor(user) {
    if (!user) return false;

    const supervisorQuery = query(
        collection(db, "users"),
        where("uid", "==", user.uid)
    );

    const snapshot = await getDocs(supervisorQuery);

    if (snapshot.empty) return false;

    const supervisorDoc = snapshot.docs[0];
    const supervisorData = supervisorDoc.data();

    if (
        String(supervisorData.role || "").toLowerCase() !== "supervisor" ||
        supervisorData.active !== true
    ) {
        return false;
    }

    currentSupervisor = {
        id: supervisorDoc.id,
        ...supervisorData
    };

    return true;
}

// ESCAPE HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

// LOAD DRIVERS FROM FIRESTORE
async function loadDrivers() {
    if (!driversContainer) return;

    driversContainer.textContent = "Loading drivers...";

    try {
        const driversQuery = query(
            collection(db, "users"),
            where("role", "==", "driver")
        );

        const snapshot = await getDocs(driversQuery);

        availableDrivers = snapshot.docs.map(driverDoc => ({
            id: driverDoc.id,
            ...driverDoc.data()
        }));

        renderDrivers();

    } catch (error) {
        console.error("Error loading drivers:", error);
        driversContainer.textContent = "Unable to load drivers. Please try again.";
    }
}

// DISPLAY DRIVERS
function renderDrivers() {
    if (!driversContainer) return;

    if (availableDrivers.length === 0) {
        driversContainer.innerHTML =
            `<div class="empty-state">No drivers found.</div>`;
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

// REFRESH BUTTON
if (refreshDriversButton) {
    refreshDriversButton.addEventListener("click", loadDrivers);
}

// LOGOUT BUTTON
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
        currentSupervisor = null;
        window.location.href = "login.html";
        return;
    }

    try {
        const verified = await verifySupervisor(user);

        if (!verified) {
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }

        if (supervisorName) {
            supervisorName.textContent =
                currentSupervisor.name || user.displayName || user.email || "Supervisor";
        }

        showMessage("");

        await loadDrivers();

    } catch (error) {
        console.error("Supervisor authentication error:", error);
        showMessage("Unable to verify supervisor account. Please try again.");
    }
});
