import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import { firebaseConfig } from "./firebase-config.js";


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);



window.registerUser = function(){

let email = document.getElementById("email").value;
let password = document.getElementById("password").value;


createUserWithEmailAndPassword(auth,email,password)

.then(()=>{

alert("Account created successfully");

})

.catch((error)=>{

alert(error.message);

});


};





window.loginUser = function(){

let email = document.getElementById("email").value;
let password = document.getElementById("password").value;


signInWithEmailAndPassword(auth,email,password)

.then(()=>{

alert("Login successful");

document.getElementById("loginBox").style.display="none";


})

.catch((error)=>{

alert(error.message);

});


};





window.logoutUser=function(){


signOut(auth)

.then(()=>{

alert("Logged out");

});


};
