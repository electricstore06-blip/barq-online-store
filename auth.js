import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { 
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);


// REGISTER

export async function register(email,password){

    return await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

}


// LOGIN

export async function login(email,password){

    return await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

}


// LOGOUT

export async function logout(){

    return await signOut(auth);

}
