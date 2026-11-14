
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

// VERIFY SUPERVISOR ACCOUNT
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

// SHOW MESSAGE
function showMessage(message) {
    if (supervisorMessage) {
        supervisorMessage.textContent = message;
    }
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
                supervisorData.name || user.displayName || user.email || "Supervisor";
        }

        showMessage("");

    } catch (error) {
        console.error("Supervisor authentication error:", error);
        showMessage("Unable to verify supervisor account. Please try again.");
    }
});
