// Firebase imports

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



// Initialize Firebase

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);




// OPEN LOGIN BOX

window.showLogin = function(){

document.getElementById("loginBox").style.display="block";

};




// CLOSE LOGIN BOX

window.closeLogin = function(){

document.getElementById("loginBox").style.display="none";

};





// REGISTER

window.registerUser = function(){


const email = document.getElementById("email").value;

const password = document.getElementById("password").value;



if(email==="" || password===""){

alert("Please enter email and password");

return;

}



createUserWithEmailAndPassword(auth,email,password)


.then(()=>{


alert("Account created successfully");


closeLogin();


})


.catch((error)=>{


alert(error.message);


});


};






// LOGIN

window.loginUser = function(){


const email = document.getElementById("email").value;

const password = document.getElementById("password").value;



if(email==="" || password===""){

alert("Please enter email and password");

return;

}



signInWithEmailAndPassword(auth,email,password)


.then(()=>{


alert("Login successful");


closeLogin();



})


.catch((error)=>{


alert(error.message);


});


};







// LOGOUT

window.logoutUser=function(){



signOut(auth)


.then(()=>{


alert("Logged out");


})


.catch((error)=>{


alert(error.message);


});


};
