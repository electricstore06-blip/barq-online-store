import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


console.log("BARQ AUTH JS LOADED");


// =========================
// LOGIN
// =========================

async function login(email, password) {

    return signInWithEmailAndPassword(
        auth,
        email,
        password
    );

}


// =========================
// REGISTER
// =========================

async function register(email, password) {

    return createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

}


// =========================
// LOGOUT
// =========================

async function logout() {

    return signOut(auth);

}


// =========================
// OPEN LOGIN BOX
// =========================

function openLogin() {

    console.log("openLogin() called");

    const loginBox =
        document.getElementById("loginBox");

    if (!loginBox) {

        console.error("loginBox NOT FOUND");

        return;

    }

    loginBox.style.display = "flex";

}


// =========================
// CLOSE LOGIN BOX
// =========================

function closeLogin() {

    const loginBox =
        document.getElementById("loginBox");

    if (loginBox) {

        loginBox.style.display = "none";

    }

}


// =========================
// MAKE FUNCTIONS AVAILABLE
// TO HTML
// =========================

window.openLogin = openLogin;

window.closeLogin = closeLogin;

window.login = login;

window.register = register;

window.logout = logout;


// =========================
// LOGIN BUTTON
// =========================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const loginButton =
            document.getElementById("loginButton");


        if (!loginButton) {

            console.error(
                "loginButton NOT FOUND"
            );

            return;

        }


        loginButton.addEventListener(
            "click",
            async function () {

                const email =
                    document
                        .getElementById("loginEmail")
                        .value
                        .trim();


                const password =
                    document
                        .getElementById("loginPassword")
                        .value;


                const message =
                    document
                        .getElementById("loginMessage");


                if (!email || !password) {

                    message.textContent =
                        "Please enter your email and password.";

                    return;

                }


                message.textContent =
                    "Logging in...";


                try {

                    await login(
                        email,
                        password
                    );


                    message.textContent =
                        "Login successful!";


                    console.log(
                        "Firebase login successful:",
                        email
                    );


                } catch (error) {

                    console.error(
                        "Firebase login error:",
                        error
                    );


                    message.textContent =
                        "Login failed. Please check your email and password.";

                }

            }
        );

    }
);
