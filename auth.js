
import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    FacebookAuthProvider,
    signInWithPopup,
    linkWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// PENDING FACEBOOK CREDENTIAL
// ==========================================

let pendingFacebookCredential = null;


// ==========================================
// EMAIL LOGIN
// ==========================================

async function login(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
}


// ==========================================
// FACEBOOK LOGIN
// ==========================================

async function loginWithFacebook() {
    const provider = new FacebookAuthProvider();
    return await signInWithPopup(auth, provider);
}


// ==========================================
// REGISTER CUSTOMER
// ==========================================

async function register(email, password) {
    return await createUserWithEmailAndPassword(auth, email, password);
}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        console.error("Logout failed:", error);
        alert("Unable to log out. Please try again.");
    }
}


// ==========================================
// OPEN LOGIN POPUP
// ==========================================

function openLogin() {
    const mobileNav = document.querySelector(".nav-links");

    if (mobileNav) {
        mobileNav.classList.remove("active");
    }

    const loginBox = document.getElementById("loginBox");

    if (loginBox) {
        loginBox.style.display = "flex";
    }
}


// ==========================================
// CLOSE LOGIN POPUP
// ==========================================

function closeLogin() {
    const loginBox = document.getElementById("loginBox");

    if (loginBox) {
        loginBox.style.display = "none";
    }
}

document.addEventListener("click", function (event) {
    const loginBox = document.getElementById("loginBox");

    if (loginBox && event.target === loginBox) {
        closeLogin();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeLogin();
    }
});


// ==========================================
// CHECK ADMIN ROLE
// ==========================================

async function checkAdmin(user) {
    try {
        const adminRef = doc(db, "admins", user.uid);
        const adminSnapshot = await getDoc(adminRef);

        if (!adminSnapshot.exists()) {
            return false;
        }

        return adminSnapshot.data().role === "admin";
    } catch (error) {
        console.error("Admin role check failed:", error);
        return false;
    }
}


// ==========================================
// GET STAFF ROLE
// ==========================================

async function getStaffRole(user) {
    try {
        const usersRef = collection(db, "users");

        const staffQuery = query(
            usersRef,
            where("uid", "==", user.uid)
        );

        const staffSnapshot = await getDocs(staffQuery);

        if (staffSnapshot.empty) {
            return null;
        }

        return staffSnapshot.docs[0].data().role || null;
    } catch (error) {
        console.error("Staff role check failed:", error);
        return null;
    }
}


// ==========================================
// LOGIN BUTTON
// ==========================================

const loginButton = document.getElementById("loginButton");

if (loginButton) {
    loginButton.addEventListener("click", async function () {
        const emailInput = document.getElementById("loginEmail");
        const passwordInput = document.getElementById("loginPassword");
        const message = document.getElementById("loginMessage");

        if (!emailInput || !passwordInput || !message) {
            console.error("Login form elements are missing.");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        message.textContent = "";
        message.style.color = "";

        if (!email || !password) {
            message.textContent = "Please enter your email and password.";
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";

        try {
            const credential = await login(email, password);
            const user = credential.user;
            let facebookLinked = false;

            // Link Facebook only after the existing account
            // has been authenticated successfully.
            if (pendingFacebookCredential) {
                try {
                    await linkWithCredential(
                        user,
                        pendingFacebookCredential
                    );

                    pendingFacebookCredential = null;
                    facebookLinked = true;

                    console.log("Facebook account linked successfully.");
                } catch (linkError) {
                    console.error(
                        "Facebook account linking failed:",
                        linkError
                    );

                    message.style.color = "red";

                    if (
                        linkError.code ===
                        "auth/credential-already-in-use"
                    ) {
                        message.textContent =
                            "This Facebook account is already linked to another account.";
                    } else if (
                        linkError.code ===
                        "auth/provider-already-linked"
                    ) {
                        pendingFacebookCredential = null;
                        facebookLinked = true;
                    } else {
                        message.textContent =
                            "You are logged in, but Facebook could not be linked. Please try again.";
                        return;
                    }
                }
            }

            // Admin redirect
            if (await checkAdmin(user)) {
                window.location.href = "admin-orders.html";
                return;
            }

            // Supervisor and driver redirects
            const role = await getStaffRole(user);

            if (role === "supervisor" || role === "Supervisor") {
                window.location.href = "supervisor-dashboard.html";
                return;
            }

            if (role === "driver" || role === "Driver") {
                window.location.href = "driver-dashboard.html";
                return;
            }

            // Regular customer
            message.style.color = "green";
            message.textContent = facebookLinked
                ? "Login successful! Facebook linked successfully."
                : "Login successful!";

            setTimeout(function () {
                closeLogin();
                message.textContent = "";
            }, 1500);

        } catch (error) {
            console.error("Login failed:", error);
            message.style.color = "red";

            switch (error.code) {
                case "auth/invalid-email":
                    message.textContent =
                        "Please enter a valid email address.";
                    break;

                case "auth/user-not-found":
                case "auth/wrong-password":
                case "auth/invalid-credential":
                    message.textContent =
                        "Incorrect email or password.";
                    break;

                case "auth/too-many-requests":
                    message.textContent =
                        "Too many attempts. Please try again later.";
                    break;

                case "auth/network-request-failed":
                    message.textContent =
                        "Network error. Check your internet connection.";
                    break;

                case "auth/user-disabled":
                    message.textContent =
                        "This account has been disabled.";
                    break;

                default:
                    message.textContent =
                        "Login failed. Please try again.";
            }

        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Login";
        }
    });
}


// ==========================================
// REGISTER BUTTON
// ==========================================

const registerButton = document.getElementById("registerButton");

if (registerButton) {
    registerButton.addEventListener("click", async function () {
        const emailInput = document.getElementById("loginEmail");
        const passwordInput = document.getElementById("loginPassword");
        const message = document.getElementById("loginMessage");

        if (!emailInput || !passwordInput || !message) {
            console.error("Registration form elements are missing.");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        message.textContent = "";
        message.style.color = "";

        if (!email || !password) {
            message.textContent =
                "Please enter your email and password.";
            return;
        }

        if (password.length < 6) {
            message.textContent =
                "Password must be at least 6 characters.";
            return;
        }

        registerButton.disabled = true;
        registerButton.textContent = "Creating account...";

        try {
            await register(email, password);

            message.style.color = "green";
            message.textContent =
                "Account created successfully!";

            setTimeout(function () {
                closeLogin();
                message.textContent = "";
            }, 1200);

        } catch (error) {
            console.error("Registration failed:", error);
            message.style.color = "red";

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
                        "Email and password registration is not enabled in Firebase.";
                    break;

                case "auth/network-request-failed":
                    message.textContent =
                        "Network error. Check your internet connection.";
                    break;

                default:
                    message.textContent =
                        "Account creation failed. Please try again.";
            }

        } finally {
            registerButton.disabled = false;
            registerButton.textContent = "Create Account";
        }
    });
}

```js
// ==========================================
// FACEBOOK LOGIN BUTTON
// ==========================================

const facebookLoginButton =
    document.getElementById("facebookLoginButton");

if (facebookLoginButton) {
    facebookLoginButton.addEventListener("click", async function () {
        const message = document.getElementById("loginMessage");

        facebookLoginButton.disabled = true;
        facebookLoginButton.textContent = "Connecting to Facebook...";

        if (message) {
            message.textContent = "";
            message.style.color = "";
        }

        try {
            const credential = await loginWithFacebook();
            const user = credential.user;

            // Preserve admin redirect.
            if (await checkAdmin(user)) {
                window.location.href = "admin-orders.html";
                return;
            }

            // Preserve supervisor and driver redirects.
            const role = await getStaffRole(user);

            if (role === "supervisor" || role === "Supervisor") {
                window.location.href = "supervisor-dashboard.html";
                return;
            }

            if (role === "driver" || role === "Driver") {
                window.location.href = "driver-dashboard.html";
                return;
            }

            // Customer login successful.
            if (message) {
                message.style.color = "green";
                message.textContent = "Facebook login successful!";
            }

            setTimeout(function () {
                closeLogin();

                if (message) {
                    message.textContent = "";
                }
            }, 1000);

        } catch (error) {
            console.error("Facebook login failed:", error);

            if (message) {
                message.style.color = "red";

                if (
                    error.code ===
                    "auth/account-exists-with-different-credential"
                ) {
                    pendingFacebookCredential =
                        FacebookAuthProvider.credentialFromError(error);

                    if (pendingFacebookCredential) {
                        message.textContent =
                            "This email already has an account. Log in with your existing email and password to link Facebook.";
                    } else {
                        message.textContent =
                            "Facebook account conflict. Please log in using your existing method.";
                    }

                } else if (
                    error.code === "auth/popup-closed-by-user"
                ) {
                    message.textContent =
                        "Facebook login was cancelled.";

                } else if (
                    error.code === "auth/unauthorized-domain"
                ) {
                    message.textContent =
                        "This website domain is not authorized in Firebase.";

                } else {
                    message.textContent =
                        "Facebook login failed. Please try again.";
                }
            }

        } finally {
            facebookLoginButton.disabled = false;
            facebookLoginButton.textContent = "Continue with Facebook";
        }
    });
}
```


// ==========================================
// AUTHENTICATION STATUS
// ==========================================

onAuthStateChanged(auth, function (user) {
    if (user) {
        console.log("Signed in:", user.email);
    } else {
        console.log("No customer signed in.");
    }
});


// ==========================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ==========================================

window.openLogin = openLogin;
window.closeLogin = closeLogin;
window.login = login;
window.register = register;
window.logout = logout;

console.log("BARQ authentication initialized.");
