// ==========================================
// BARQ DRIVER LOGIN
// ==========================================

import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    doc,
    getDoc
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log("BARQ DRIVER LOGIN LOADED");



const loginBtn =
document.getElementById("login-btn");


const message =
document.getElementById("message");



loginBtn.addEventListener(
"click",
async ()=>{


const email =
document.getElementById("email")
.value
.trim();


const password =
document.getElementById("password")
.value;



if(!email || !password){

message.textContent =
"Enter email and password";

return;

}



message.textContent =
"Logging in...";



try{


const result =
await signInWithEmailAndPassword(
auth,
email,
password
);



const user =
result.user;



console.log(
"Driver login:",
user.email
);




// Check driver profile

const driverRef =
doc(
db,
"users",
user.uid
);



const driverSnap =
await getDoc(driverRef);



if(!driverSnap.exists()){


message.textContent =
"Driver account not approved";


return;


}



const driverData =
driverSnap.data();



if(driverData.role !== "driver"){


message.textContent =
"This account is not a driver";


return;


}



message.textContent =
"Login successful";



setTimeout(()=>{


window.location.href =
"driver-dashboard.html";


},800);



}
catch(error){

    console.error(error);

message.textContent =
error.code + ": " + error.message;
}
