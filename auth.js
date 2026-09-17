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
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log("BARQ AUTH JS LOADED");



// ==========================================
// LOGIN
// ==========================================

async function login(email, password){

    return await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

}



// ==========================================
// REGISTER
// ==========================================

async function register(email,password){

    return await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

}



// ==========================================
// LOGOUT
// ==========================================

async function logout(){

    return await signOut(auth);

}



// ==========================================
// OPEN LOGIN POPUP
// ==========================================

function openLogin(){

    console.log("openLogin() called");


    // close mobile menu

    const menu =
        document.getElementById("mainNav");


    if(menu){

        menu.classList.remove("active");

    }



    // open login box

    const loginBox =
        document.getElementById("loginBox");


    if(!loginBox){

        console.error(
            "loginBox NOT FOUND"
        );

        return;

    }


    loginBox.style.display = "flex";


}



// ==========================================
// CLOSE LOGIN POPUP
// ==========================================

function closeLogin(){

    const loginBox =
        document.getElementById("loginBox");


    if(loginBox){

        loginBox.style.display = "none";

    }

}



// ==========================================
// CLOSE LOGIN BY CLICK OUTSIDE
// ==========================================

document.addEventListener(
    "click",
    function(event){

        const loginBox =
            document.getElementById("loginBox");


        if(
            loginBox &&
            loginBox.style.display === "flex" &&
            event.target === loginBox
        ){

            closeLogin();

        }

    }
);



// ==========================================
// CLOSE LOGIN WITH ESC
// ==========================================

document.addEventListener(
    "keydown",
    function(event){

        if(event.key === "Escape"){

            closeLogin();

        }

    }
);



// ==========================================
// CHECK ADMIN
// ==========================================

async function checkAdmin(user){

    if(!user){

        return false;

    }


    try{


        const adminRef =
            doc(
                db,
                "admins",
                user.uid
            );


        const adminSnap =
            await getDoc(adminRef);



        if(!adminSnap.exists()){

            return false;

        }



        const data =
            adminSnap.data();



        return data.role === "admin";


    }
    catch(error){


        console.error(
            "Admin check error:",
            error
        );


        return false;

    }


}



// ==========================================
// LOGIN BUTTON
// ==========================================

document.addEventListener(
"DOMContentLoaded",
function(){


    const loginButton =
        document.getElementById(
            "loginButton"
        );



    if(!loginButton){

        console.error(
            "loginButton NOT FOUND"
        );

        return;

    }



    loginButton.addEventListener(
    "click",
    async function(){


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
            document.getElementById(
                "loginMessage"
            );



        if(!email || !password){

            message.textContent =
            "Please enter email and password.";

            return;

        }



        message.textContent =
        "Logging in...";



        try{


            const result =
                await login(
                    email,
                    password
                );



            const user =
                result.user;



            console.log(
                "Login successful:",
                user.email
            );



            const admin =
                await checkAdmin(user);



            if(admin){


                message.textContent =
                "Admin login successful";


                setTimeout(
                function(){


                    window.location.href =
                    "admin-orders.html";


                },
                500
                );


            }
            else{


                message.textContent =
                "Login successful";


            }



        }
        catch(error){


            console.error(
                "Firebase login error:",
                error
            );


            message.textContent =
            "Login failed. Check email and password.";


        }


    });


});



// ==========================================
// AUTH STATUS LISTENER
// ==========================================

onAuthStateChanged(
auth,
function(user){


    if(user){

        console.log(
            "Current user:",
            user.email
        );

    }
    else{

        console.log(
            "No user logged in"
        );

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



console.log(
"BARQ AUTH FUNCTIONS READY"
);
