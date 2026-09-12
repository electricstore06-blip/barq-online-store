// BARQ Online Store Firebase Configuration


import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import { getFirestore } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// Firebase Config

const firebaseConfig = {

apiKey: "AIzaSyCV3N68e7GXNgNALXTiWjsYOQVFhqisTIc",

authDomain: "barq-online-store.firebaseapp.com",

projectId: "barq-online-store",

storageBucket: "barq-online-store.firebasestorage.app",

messagingSenderId: "44237208872",

appId: "1:44237208872:web:525a5bcf8c7b9d5978e41d",

measurementId: "G-KS2BC3EXDD"

};



// Initialize Firebase

const app = initializeApp(firebaseConfig);



// Initialize Firestore

const db = getFirestore(app);



// Export for auth.js and script.js

export { firebaseConfig, db };
