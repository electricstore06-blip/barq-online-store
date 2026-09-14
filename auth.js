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


import { initializeApp }
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";



const app = initializeApp(firebaseConfig);


const auth=getAuth(app);




// SHOW LOGIN

window.showLogin=function(){

document.getElementById("loginBox").style.display="block";

}




// CLOSE LOGIN

window.closeLogin=function(){

document.getElementById("loginBox").style.display="none";

}





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


location.reload();


});


};







// USER STATUS


onAuthStateChanged(auth,(user)=>{


let loginButton=document.getElementById("loginButton");


if(!loginButton)return;




if(user){


loginButton.innerHTML="👤 "+user.email+" | Logout";


loginButton.onclick=logoutUser;



}

else{


loginButton.innerHTML="🔒 Login";


loginButton.onclick=showLogin;



}



});
