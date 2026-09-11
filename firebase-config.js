import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyCV3N8G7XGNAuXI7iwjYXXVqhsiTc",
  authDomain: "barq-online-store.firebaseapp.com",
  projectId: "barq-online-store",
  storageBucket: "barq-online-store.firebasestorage.app",
  messagingSenderId: "4423708827",
  appId: "1:4423708827:web:525a5bc8c7b9d5978e41d",
  measurementId: "G-KS2BC3EXDD"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
