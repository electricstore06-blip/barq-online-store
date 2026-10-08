import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const firebaseConfig = {

    apiKey: "AIzaSyBFZKliLs7ZEHK2bGgasw1GjM0vbVNPVA",

    authDomain: "barq-online-store-a1413.firebaseapp.com",

    projectId: "barq-online-store-a1413",

    storageBucket: "barq-online-store-a1413.firebasestorage.app",

    messagingSenderId: "596823702006",

    appId: "1:596823702006:web:ce59d80e74a16297a72fd7"

};


const driverApp = initializeApp(
    firebaseConfig,
    "BARQ_DRIVER_APP"
);


const db = getFirestore(driverApp);

const auth = getAuth(driverApp);


export { db, auth };
