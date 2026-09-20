import { db, auth } from "./firebase-config.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signOut,
    getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";



/* =====================================
   SECONDARY FIREBASE APP
   Used ONLY to create staff accounts
===================================== */

const staffFirebaseConfig = {

    apiKey: "AIzaSyBFZKliLs7ZEHK2hbGgasw1GjM0vbVNPVA",

    authDomain: "barq-online-store-a1413.firebaseapp.com",

    projectId: "barq-online-store-a1413",

    storageBucket: "barq-online-store-a1413.firebasestorage.app",

    messagingSenderId: "596823702006",

    appId: "1:596823702006:web:ce59d80e74a16297a72fd7"

};


const staffApp =
    initializeApp(
        staffFirebaseConfig,
        "staffCreationApp"
    );


const staffAuth =
    getAuth(staffApp);




/* =====================================
   ELEMENTS
===================================== */

const nameInput =
    document.getElementById("staff-name");


const emailInput =
    document.getElementById("staff-email");


const phoneInput =
    document.getElementById("staff-phone");


const roleInput =
    document.getElementById("staff-role");


const cityInput =
    document.getElementById("staff-city");


const passwordInput =
    document.getElementById("staff-password");


const createButton =
    document.getElementById("create-staff-btn");


const message =
    document.getElementById("staff-message");


const backButton =
    document.getElementById("back-btn");




/* =====================================
   CHECK ADMIN
===================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "index.html";

            return;
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

                alert(
                    "Access denied"
                );


                window.location.href =
                    "index.html";


                return;
            }


            const adminData =
                adminSnap.data();


            if (
                adminData.role &&
                adminData.role !== "admin"
            ) {

                alert(
                    "Access denied"
                );


                window.location.href =
                    "index.html";


                return;
            }


            console.log(
                "Admin verified:",
                user.email
            );


        }

        catch (error) {

            console.error(
                "Admin verification error:",
                error
            );


            message.textContent =
                "Unable to verify admin access.";

        }

    }
);




/* =====================================
   CREATE STAFF
===================================== */

createButton.addEventListener(
    "click",
    async () => {

        const name =
            nameInput.value.trim();


        const email =
            emailInput.value.trim();


        const phone =
            phoneInput.value.trim();


        const role =
            roleInput.value;


        const city =
            cityInput.value.trim();


        const password =
            passwordInput.value;



        /* ================================
           VALIDATION
        ================================= */

        if (
            !name ||
            !email ||
            !phone ||
            !role ||
            !city ||
            !password
        ) {

            message.textContent =
                "Please fill all fields.";

            return;
        }



        if (password.length < 6) {

            message.textContent =
                "Password must be at least 6 characters.";

            return;
        }



        try {

            createButton.disabled = true;


            message.textContent =
                "Creating staff account...";



            /* ================================
               CREATE STAFF IN SECONDARY AUTH
            ================================= */

            const userCredential =
                await createUserWithEmailAndPassword(
                    staffAuth,
                    email,
                    password
                );


            const uid =
                userCredential.user.uid;



            console.log(
                "Staff Firebase Auth account created:",
                uid
            );



            /* ================================
               SAVE STAFF PROFILE
               PRIMARY ADMIN AUTH IS STILL ACTIVE
            ================================= */

            await addDoc(
                collection(
                    db,
                    "users"
                ),
                {

                    uid: uid,

                    name: name,

                    email: email,

                    phone: phone,

                    role: role,

                    city: city,

                    active: true,

                    createdAt:
                        serverTimestamp()

                }
            );



            console.log(
                "Staff profile saved to Firestore."
            );



            /* ================================
               SIGN OUT SECONDARY AUTH
            ================================= */

            await signOut(
                staffAuth
            );



            /* ================================
               SUCCESS
            ================================= */

            message.textContent =
                "Staff account created successfully.";



            nameInput.value = "";

            emailInput.value = "";

            phoneInput.value = "";

            roleInput.value = "";

            cityInput.value = "";

            passwordInput.value = "";


        }


        catch (error) {

            console.error(
                "Staff creation error:",
                error
            );


            let errorMessage =
                "Unable to create staff account.";



            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                errorMessage =
                    "This email is already registered in Firebase.";

            }


            else if (
                error.code ===
                "auth/invalid-email"
            ) {

                errorMessage =
                    "Please enter a valid email address.";

            }


            else if (
                error.code ===
                "auth/weak-password"
            ) {

                errorMessage =
                    "Password is too weak. Use at least 6 characters.";

            }


            else if (
                error.code ===
                "permission-denied" ||
                error.code ===
                "firestore/permission-denied"
            ) {

                errorMessage =
                    "Firestore permission denied. The Admin Firestore rules need to allow admins to create staff records.";

            }


            else if (error.message) {

                errorMessage =
                    error.message;

            }



            message.textContent =
                errorMessage;

        }


        finally {

            createButton.disabled = false;

        }

    }
);




/* =====================================
   BACK BUTTON
===================================== */

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "admin-orders.html";

        }
    );

}
