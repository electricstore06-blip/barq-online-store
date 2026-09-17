import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


console.log("BARQ AUTH JS LOADED");


// LOGIN
async function login(email, password) {

    return signInWithEmailAndPassword(
        auth,
        email,
        password
    );

}


// REGISTER
async function register(email, password) {

    return createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

}


// LOGOUT
async function logout() {

    return signOut(auth);

}


// OPEN LOGIN POPUP
function openLogin() {

    console.log("openLogin() called");

    const loginBox =
        document.getElementById("loginBox");

    if (!loginBox) {

        console.error(
            "loginBox NOT FOUND"
        );

        return;
    }

    loginBox.style.setProperty(
    "display",
    "flex",
    "important"
);

}


// CLOSE LOGIN POPUP
function closeLogin() {

    const loginBox =
        document.getElementById("loginBox");

    if (loginBox) {

        loginBox.style.display = "none";

    }

}


// CHECK IF USER IS ADMIN
async function checkAdmin(user) {

    if (!user) {

        return false;

    }

    try {

        const adminRef =
            doc(
                db,
                "admins",
                user.uid
            );

        const adminSnap =
            await getDoc(adminRef);


        if (!adminSnap.exists()) {

            return false;

        }


        const adminData =
            adminSnap.data();


        return adminData.role === "admin";


    } catch (error) {

        console.error(
            "Admin check error:",
            error
        );

        return false;

    }

}


// MAKE FUNCTIONS AVAILABLE TO HTML
window.openLogin = openLogin;
window.closeLogin = closeLogin;
window.login = login;
window.register = register;
window.logout = logout;


// LOGIN BUTTON
document.addEventListener(
    "DOMContentLoaded",
    function () {

        const loginButton =
            document.getElementById(
                "loginButton"
            );


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
                        .getElementById(
                            "loginEmail"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "loginPassword"
                        )
                        .value;


                const message =
                    document.getElementById(
                        "loginMessage"
                    );


                if (!email || !password) {

                    message.textContent =
                        "Please enter your email and password.";

                    return;

                }


                message.textContent =
                    "Logging in...";


                try {

                    const result =
                        await login(
                            email,
                            password
                        );


                    const user =
                        result.user;


                    console.log(
                        "Firebase login successful:",
                        user.email
                    );


                    message.textContent =
                        "Checking account...";


                    const admin =
                        await checkAdmin(user);


                    if (admin) {

                        message.textContent =
                            "Admin login successful!";


                        console.log(
                            "Admin verified. Opening admin orders page."
                        );


                        setTimeout(
                            function () {

                                window.location.href =
                                    "admin-orders.html";

                            },
                            500
                        );


                    } else {

                        message.textContent =
                            "Login successful!";

                        console.log(
                            "Regular customer login."
                        );

                    }


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
window.openLogin = openLogin;
window.closeLogin = closeLogin;
window.login = login;
window.register = register;
window.logout = logout;

console.log("BARQ AUTH FUNCTIONS READY");
