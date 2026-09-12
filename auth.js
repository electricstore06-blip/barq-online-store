import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import { firebaseConfig } from "./firebase-config.js";


// Firebase start

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);


// Open Login Box

function showLogin(){

document.getElementById("loginBox").style.display="block";

}


// Close Login Box

function closeLogin(){

document.getElementById("loginBox").style.display="none";

}



// Register

async function registerUser(){

let email=document.getElementById("email").value;

let password=document.getElementById("password").value;


try{

await createUserWithEmailAndPassword(
auth,
email,
password
);


alert("Account created successfully");


closeLogin();


}

catch(error){

alert(error.message);

}

}



// Login

async function loginUser(){

let email=document.getElementById("email").value;

let password=document.getElementById("password").value;


try{


await signInWithEmailAndPassword(
auth,
email,
password
);


alert("Login successful");


closeLogin();


}


catch(error){

alert(error.message);

}


}



// Logout

async function logoutUser(){

await signOut(auth);

alert("Logged out");

}



// Make functions available to HTML

window.showLogin = showLogin;

window.closeLogin = closeLogin;

window.registerUser = registerUser;

window.loginUser = loginUser;

window.logoutUser = logoutUser;



// Button listener

document.addEventListener("DOMContentLoaded",()=>{


let btn=document.getElementById("loginBtn");


if(btn){

btn.addEventListener("click",showLogin);

}


});
