import { auth } from "./firebase-config.js";


import {

signInWithEmailAndPassword,

createUserWithEmailAndPassword,

signOut

}

from

"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";




// LOGIN FUNCTION

function login(email,password){


return signInWithEmailAndPassword(

auth,

email,

password

);


}





// REGISTER FUNCTION

function register(email,password){


return createUserWithEmailAndPassword(

auth,

email,

password

);


}




// LOGOUT FUNCTION

function logout(){


return signOut(auth);


}




window.login = login;

window.register = register;

window.logout = logout;
