import { db } from "./firebase-config.js";

import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const order =
    JSON.parse(localStorage.getItem("barqOrder"));


if(order){

    const orderId = order.id;


    if(orderId){

        const orderRef = doc(db, "orders", orderId);


        onSnapshot(orderRef, (snapshot)=>{


            if(snapshot.exists()){


                const data = snapshot.data();


                document.getElementById("order-status").textContent =
                    data.status || "Pending";


            }


        });


    }

}
