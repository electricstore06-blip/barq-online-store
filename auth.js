import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// LOGIN FUNCTION

async function login(email, password) {

    return signInWithEmailAndPassword(
        auth,
        email,
        password
    );

}


// REGISTER FUNCTION

async function register(email, password) {

    return createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

}


// LOGOUT FUNCTION

async function logout() {

    return signOut(auth);

}


// LOGIN BOX

function openLogin() {

    const loginBox = document.getElementById("loginBox");

    if (loginBox) {
        loginBox.style.display = "flex";
    }

}


function closeLogin() {

    const loginBox = document.getElementById("loginBox");

    if (loginBox) {
        loginBox.style.display = "none";
    }

}


// LOGIN BUTTON

const loginButton = document.getElementById("loginButton");

if (loginButton) {

    loginButton.addEventListener("click", async function () {

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const message =
            document.getElementById("loginMessage");


        if (!email || !password) {

            message.textContent =
                "Please enter your email and password.";

            return;
        }


        message.textContent = "Logging in...";


        try {

            await login(email, password);

            message.textContent =
                "Login successful!";


            /*
             * STEP 3 WILL DECIDE
             * WHERE THE USER GOES.
             *
             * For now, stay on this page.
             */


        } catch (error) {

            console.error("Login error:", error);

            message.textContent =
                "Login failed. Please check your email and password.";

        }

    });

}


// MAKE FUNCTIONS AVAILABLE TO HTML

window.login = login;
window.register = register;

window.logout = logout;

window.openLogin = openLogin;
window.closeLogin = closeLogin;
