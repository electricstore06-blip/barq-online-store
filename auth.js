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


// Firebase start

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);



// OPEN LOGIN

window.showLogin=function(){

document.getElementById("loginBox").style.display="block";

};


// CLOSE LOGIN

window.closeLogin=function(){

document.getElementById("loginBox").style.display="none";

};



// REGISTER

window.registerUser=function(){

let email=document.getElementById("email").value;

let password=document.getElementById("password").value;


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

let email=document.getElementById("email").value;

let password=document.getElementById("password").value;


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

location.reload();

});

};





// CHECK LOGIN STATUS

onAuthStateChanged(auth,(user)=>{


let button=document.getElementById("loginButton");

let admin=document.getElementById("adminLink");



if(user){


button.innerHTML="👤 "+user.email+" | Logout";

button.onclick=logoutUser;



if(admin){

admin.style.display="inline";

}



}

else{


button.innerHTML="🔒 Login";

button.onclick=showLogin;


if(admin){

admin.style.display="none";

}


}



});
