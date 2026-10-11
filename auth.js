// ==========================================
// BARQ AUTH SYSTEM
// ==========================================

import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("BARQ AUTH LOADED");

// ==========================================
// LOGIN FUNCTION
// ==========================================

async function login(email, password) {
    return await signInWithEmailAndPassword(
        auth,
        email,
        password
    );
}

// ==========================================
// REGISTER FUNCTION
// ==========================================

async function register(email, password) {
    return await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );
}

// ==========================================
// LOGOUT
// ==========================================

async function logout() {
    await signOut(auth);
    location.reload();
}

// ==========================================
// OPEN LOGIN
// ==========================================

function openLogin() {
    const menu = document.getElementById("mainNav");

    if (menu) {
        menu.classList.remove("active");
    }

    const box = document.getElementById("loginBox");

    if (box) {
        box.style.display = "flex";
    }
}

// ==========================================
// CLOSE LOGIN
// ==========================================

function closeLogin() {
    const box = document.getElementById("loginBox");

    if (box) {
        box.style.display = "none";
    }
}

// ==========================================
// CLICK OUTSIDE TO CLOSE
// ==========================================

window.addEventListener("click", (event) => {
    const box = document.getElementById("loginBox");

    if (box && event.target === box) {
        closeLogin();
    }
});

// ==========================================
// ESCAPE KEY TO CLOSE
// ==========================================

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeLogin();
    }
});

// ==========================================
// ADMIN CHECK
// ==========================================

async function checkAdmin(user) {
    if (!user) {
        return false;
    }

    try {
        const adminRef = doc(db, "admins", user.uid);
        const snapshot = await getDoc(adminRef);

        if (!snapshot.exists()) {
            return false;
        }

        const data = snapshot.data();

        return data.role === "admin";
    } catch (error) {
        console.error("Admin check error:", error);
        return false;
    }
}

// ==========================================
// STAFF ROLE CHECK
// ==========================================

async function getStaffRole(user) {
    if (!user) {
        return null;
    }

    try {
        const usersRef = collection(db, "users");

        const staffQuery = query(
            usersRef,
            where("uid", "==", user.uid)
        );

        const snapshot = await getDocs(staffQuery);

        if (snapshot.empty) {
            console.log(
                "No staff profile found for:",
                user.email
            );

            return null;
        }

        const staffData = snapshot.docs[0].data();

        console.log("Staff profile:", staffData);

        return staffData.role || null;
    } catch (error) {
        console.error("Staff role check error:", error);
        return null;
    }
}

// ==========================================
// LOGIN BUTTON
// ==========================================

const loginButton = document.getElementById("loginButton");

if (loginButton) {
    loginButton.addEventListener("click", async () => {
        const email = document
            .getElementById("loginEmail")
            .value
            .trim();

        const password = document
            .getElementById("loginPassword")
            .value;

        const message = document.getElementById("loginMessage");

        if (!email || !password) {
            message.textContent = "Enter email and password.";
            return;
        }

        message.textContent = "Logging in...";

        try {
            // Firebase login
            const result = await login(email, password);
            const user = result.user;

            console.log("LOGIN:", user.email);

            // Check administrator
            const admin = await checkAdmin(user);

            if (admin) {
                message.textContent = "Admin login successful.";

                setTimeout(() => {
                    window.location.href = "admin-orders.html";
                }, 800);

                return;
            }

            // Check staff role
            const role = await getStaffRole(user);

            console.log("USER ROLE:", role);

            // Supervisor
            if (
                role === "supervisor" ||
                role === "Supervisor"
            ) {
                message.textContent =
                    "Supervisor login successful.";

                setTimeout(() => {
                    window.location.href =
                        "supervisor-dashboard.html";
                }, 800);

                return;
            }

            // Driver
            if (
                role === "driver" ||
                role === "Driver"
            ) {
                message.textContent =
                    "Driver login successful.";

                setTimeout(() => {
                    window.location.href =
                        "driver-dashboard.html";
                }, 800);

                return;
            }

            // Customer or other user
            message.textContent = "Login successful.";

            setTimeout(() => {
                closeLogin();
            }, 1000);

        } catch (error) {
            console.error("Login error:", error);

            switch (error.code) {
                case "auth/invalid-email":
                    message.textContent =
                        "Invalid email address.";
                    break;

                case "auth/user-not-found":
                    message.textContent =
                        "User not found.";
                    break;

                case "auth/wrong-password":
                    message.textContent =
                        "Wrong password.";
                    break;

                case "auth/invalid-credential":
                    message.textContent =
                        "Email or password incorrect.";
                    break;

                case "auth/too-many-requests":
                    message.textContent =
                        "Too many attempts. Please try again later.";
                    break;

                default:
                    message.textContent =
                        "Login failed. Please try again.";
            }
        }
    });
} else {
    console.log("loginButton not found.");
}

// ==========================================
// CUSTOMER REGISTRATION BUTTON
// ==========================================

const registerButton =
    document.getElementById("registerButton");

if (registerButton) {
    registerButton.addEventListener("click", async () => {
        const email = document
            .getElementById("loginEmail")
            .value
            .trim();

        const password = document
            .getElementById("loginPassword")
            .value;

        const message =
            document.getElementById("loginMessage");

        if (!email || !password) {
            message.textContent =
                "Enter your email and password.";

            return;
        }

        if (password.length < 6) {
            message.textContent =
                "Password must contain at least 6 characters.";

            return;
        }

        message.textContent = "Creating your account...";

        try {
            await register(email, password);

            message.textContent =
                "Account created successfully!";

            setTimeout(() => {
                closeLogin();
            }, 1000);

        } catch (error) {
            console.error("Registration error:", error);

            switch (error.code) {
                case "auth/email-already-in-use":
                    message.textContent =
                        "This email already has an account. Please log in.";
                    break;

                case "auth/invalid-email":
                    message.textContent =
                        "Please enter a valid email address.";
                    break;

                case "auth/weak-password":
                    message.textContent =
                        "Please choose a stronger password.";
                    break;

                case "auth/operation-not-allowed":
                    message.textContent =
                        "Email/password registration is not enabled in Firebase.";
                    break;

                case "auth/network-request-failed":
                    message.textContent =
                        "Network error. Please check your internet connection.";
                    break;

                default:
                    message.textContent =
                        "Registration failed. Please try again.";
            }
        }
    });
}

// ==========================================
// USER AUTHENTICATION STATUS
// ==========================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Current user:", user.email);
    } else {
        console.log("No user signed in.");
    }
});

// ==========================================
// EXPORT FUNCTIONS FOR HTML
// ==========================================

window.openLogin = openLogin;
window.closeLogin = closeLogin;
window.login = login;
window.register = register;
window.logout = logout;

console.log("BARQ AUTH READY");
