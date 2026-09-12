import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";


// START FIREBASE

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);


// SHOW LOGIN

window.showLogin = function(){

document.getElementById("loginBox").style.display="block";

};


// CLOSE LOGIN

window.closeLogin = function(){

document.getElementById("loginBox").style.display="none";

};



// REGISTER

window.registerUser=function(){

const email=document.getElementById("email").value;
const password=document.getElementById("password").value;


createUserWithEmailAndPassword(auth,email,password)

.then(()=>{

alert("Account created successfully");

closeLogin();

})

.catch(error=>{

alert(error.message);

});

};




// LOGIN

window.loginUser=function(){

const email=document.getElementById("email").value;
const password=document.getElementById("password").value;


signInWithEmailAndPassword(auth,email,password)

.then(()=>{

alert("Login successful");

closeLogin();

})

.catch(error=>{

alert(error.message);

});

};




// LOGOUT

window.logoutUser=function(){

signOut(auth)

.then(()=>{

alert("Logged out");

});

};

// CHECK USER STATUS

onAuthStateChanged(auth,(user)=>{

let loginButton = document.getElementById("loginButton");

let adminLink = document.getElementById("adminLink");


if(!loginButton){
    return;
}


if(user){

    loginButton.innerHTML = "👤 " + user.email + " | Logout";

    loginButton.onclick = logoutUser;


    if(adminLink){
        adminLink.style.display="block";
    }


}else{


    loginButton.innerHTML = "🔒 Login";

    loginButton.onclick = showLogin;


    if(adminLink){
        adminLink.style.display="none";
    }

}


});




