import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { 
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);



export function register(email,password){

    return createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

}



export function login(email,password){

    return signInWithEmailAndPassword(
        auth,
        email,
        password
    );

}



export function logout(){

    return signOut(auth);

}
