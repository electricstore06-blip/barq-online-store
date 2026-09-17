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



// ===============================
// LOGIN
// ===============================

async function login(email, password){

    return signInWithEmailAndPassword(
        auth,
        email,
        password
    );

}



// ===============================
// REGISTER
// ===============================

async function register(email,password){

    return createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

}



// ===============================
// LOGOUT
// ===============================

async function logout(){

    return signOut(auth);

}




// ===============================
// OPEN LOGIN
// ===============================

function openLogin(){

    console.log("openLogin() called");


    // close mobile menu

    const menu =
        document.getElementById("mainNav");


    if(menu){

        menu.classList.remove("active");

    }



    const loginBox =
        document.getElementById("loginBox");


    if(!loginBox){

        console.error(
            "loginBox NOT FOUND"
        );

        return;

    }


    loginBox.style.display="flex";


}




// ===============================
// CLOSE LOGIN
// ===============================

function closeLogin(){

    const loginBox =
        document.getElementById("loginBox");


    if(loginBox){

        loginBox.style.display="none";

    }

}



// close when clicking outside

document.addEventListener(
"click",
function(e){

    const loginBox =
        document.getElementById("loginBox");


    const content =
        document.querySelector(".login-content");


    if(
        loginBox &&
        loginBox.style.display==="flex" &&
        e.target===loginBox
    ){

        closeLogin();

    }


});



// close with ESC

document.addEventListener(
"keydown",
function(e){

    if(e.key==="Escape"){

        closeLogin();

    }

});





// ===============================
// CHECK ADMIN
// ===============================

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



        return (
            adminSnap.data().role==="admin"
        );


    }
    catch(error){

        console.error(
            "Admin check error:",
            error
        );


        return false;

    }


}





// ===============================
// LOGIN BUTTON
// ===============================

document.addEventListener(
"DOMContentLoaded",
function(){


const button =
document.getElementById(
"loginButton"
);



if(!button){

console.error(
"loginButton NOT FOUND"
);

return;

}



button.addEventListener(
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


setTimeout(()=>{

window.location.href =
"admin-orders.html";


},500);



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






// ===============================
// AUTH STATUS
// ===============================

onAuthStateChanged(
auth,
(user)=>{


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




// ===============================
// EXPORT TO HTML
// ===============================

window.openLogin=openLogin;
window.closeLogin=closeLogin;
window.login=login;
window.register=register;
window.logout=logout;


console.log(
"BARQ AUTH FUNCTIONS READY"
);
