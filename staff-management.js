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
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



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


onAuthStateChanged(auth, async(user)=>{


if(!user){

window.location.href="index.html";

return;

}



const adminRef =
doc(db,"admins",user.uid);



const adminSnap =
await getDoc(adminRef);



if(!adminSnap.exists()){


alert("Access denied");


window.location.href="index.html";


return;


}



});





/* =====================================
   CREATE STAFF
===================================== */


createButton.addEventListener(
"click",
async()=>{


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




if(
!name ||
!email ||
!phone ||
!role ||
!city ||
!password
){


message.textContent =
"Please fill all fields.";


return;


}



try{


message.textContent =
"Creating account...";



const userCredential =
await createUserWithEmailAndPassword(
auth,
email,
password
);



const uid =
userCredential.user.uid;



await addDoc(
collection(db,"users"),
{

uid:uid,

name:name,

email:email,

phone:phone,

role:role,

city:city,

active:true,

createdAt:
serverTimestamp()

}

);



message.textContent =
"Staff account created successfully.";





nameInput.value="";
emailInput.value="";
phoneInput.value="";
roleInput.value="";
cityInput.value="";
passwordInput.value="";



}



catch(error){


console.error(
"Staff creation error:",
error
);



message.textContent =
error.message;



}


});





/* =====================================
   BACK BUTTON
===================================== */


backButton.addEventListener(
"click",
()=>{


window.location.href =
"admin-orders.html";


}
);
