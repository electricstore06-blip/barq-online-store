import { db } from "./firebase-config.js";

import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const orderId = localStorage.getItem("barqOrderId");

if(orderId){

const orderRef = doc(db,"orders",orderId);

onSnapshot(orderRef,(snapshot)=>{

if(snapshot.exists()){

const data = snapshot.data();

document.getElementById("order-number").textContent =
data.orderNumber;

document.getElementById("order-total").textContent =
"SAR " + data.total;

document.getElementById("order-status").textContent =
data.status || "Pending";

}

});

}
