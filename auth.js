/* =========================================================
   BARQ ONLINE STORE
   auth.js
   ========================================================= */


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const loginButton = document.getElementById("loginButton");
const closeLoginButton = document.getElementById("closeLoginButton");
const loginOverlay = document.getElementById("loginOverlay");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");


/* =========================================================
   LOGIN STATE
   ========================================================= */

let loggedInUser = JSON.parse(
    localStorage.getItem("barqUser")
) || null;


/* =========================================================
   SAVE USER
   ========================================================= */

function saveUser(user) {

    loggedInUser = user;

    localStorage.setItem(
        "barqUser",
        JSON.stringify(user)
    );

}


/* =========================================================
   REMOVE USER
   ========================================================= */

function logoutUser() {

    loggedInUser = null;

    localStorage.removeItem("barqUser");

    updateLoginButton();

}


/* =========================================================
   OPEN LOGIN
   ========================================================= */

function openLogin() {

    if (!loginOverlay) {
        return;
    }

    loginOverlay.classList.add("active");

    document.body.classList.add("login-open");

}


/* =========================================================
   CLOSE LOGIN
   ========================================================= */

function closeLogin() {

    if (!loginOverlay) {
        return;
    }

    loginOverlay.classList.remove("active");

    document.body.classList.remove("login-open");

}


/* =========================================================
   UPDATE LOGIN BUTTON
   ========================================================= */

function updateLoginButton() {

    if (!loginButton) {
        return;
    }

    if (loggedInUser) {

        loginButton.textContent = "Logout";

        loginButton.setAttribute(
            "aria-label",
            "Logout from your account"
        );

    } else {

        loginButton.textContent = "Login";

        loginButton.setAttribute(
            "aria-label",
            "Open login"
        );

    }

}


/* =========================================================
   SHOW LOGIN MESSAGE
   ========================================================= */

function showLoginMessage(message, type = "") {

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent = message;

    loginMessage.className = "login-message";

    if (type) {
        loginMessage.classList.add(type);
    }

}


/* =========================================================
   LOGIN
   ========================================================= */

function handleLogin(event) {

    event.preventDefault();

    if (!loginEmail || !loginPassword) {
        return;
    }


    const email = loginEmail.value.trim();

    const password = loginPassword.value.trim();


    if (!email || !password) {

        showLoginMessage(
            "Please enter your email and password.",
            "error"
        );

        return;
    }


    if (!email.includes("@")) {

        showLoginMessage(
            "Please enter a valid email address.",
            "error"
        );

        return;
    }


    if (password.length < 4) {

        showLoginMessage(
            "Password must contain at least 4 characters.",
            "error"
        );

        return;
    }


    const user = {
        email: email
    };


    saveUser(user);

    showLoginMessage(
        "Login successful!",
        "success"
    );


    updateLoginButton();


    setTimeout(() => {

        closeLogin();

        if (loginForm) {
            loginForm.reset();
        }

        showLoginMessage("");

    }, 700);

}


/* =========================================================
   LOGIN BUTTON
   ========================================================= */

if (loginButton) {

    loginButton.addEventListener("click", () => {

        if (loggedInUser) {

            logoutUser();

        } else {

            openLogin();

        }

    });

}


/* =========================================================
   CLOSE LOGIN BUTTON
   ========================================================= */

if (closeLoginButton) {

    closeLoginButton.addEventListener(
        "click",
        closeLogin
    );

}


/* =========================================================
   LOGIN FORM
   ========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        handleLogin
    );

}


/* =========================================================
   CLOSE LOGIN WHEN CLICKING OUTSIDE BOX
   ========================================================= */

if (loginOverlay) {

    loginOverlay.addEventListener("click", event => {

        if (event.target === loginOverlay) {

            closeLogin();

        }

    });

}


/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        closeLogin();

    }

});


/* =========================================================
   INITIALIZE AUTH
   ========================================================= */

updateLoginButton();
