import { db, auth } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* =========================================
   ELEMENTS
========================================= */

const ordersContainer =
    document.getElementById("orders-container");

const adminMessage =
    document.getElementById("admin-message");

const refreshButton =
    document.getElementById("refresh-btn");

const logoutButton =
    document.getElementById("logout-btn");


/* =========================================
   CHECK ADMIN LOGIN
========================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "index.html";

        return;
    }


    console.log(
        "Logged-in user:",
        user.email
    );


    try {

        const adminRef =
            doc(db, "admins", user.uid);


        const adminSnap =
            await getDoc(adminRef);


        if (!adminSnap.exists()) {

            alert(
                "Access denied. You are not an administrator."
            );


            await signOut(auth);


            window.location.href =
                "index.html";


            return;

        }


        const adminData =
            adminSnap.data();


        if (adminData.role !== "admin") {

            alert(
                "Access denied. You are not an administrator."
            );


            await signOut(auth);


            window.location.href =
                "index.html";


            return;

        }


        console.log(
            "Admin access confirmed:",
            user.email
        );


        loadOrders();


    }


    catch(error) {

        console.error(
            "Admin verification error:",
            error
        );


        adminMessage.textContent =
            "Unable to verify admin access.";

    }

});



/* =========================================
   LOAD ORDERS
========================================= */

async function loadOrders() {

    ordersContainer.innerHTML = "";


    adminMessage.textContent =
        "Loading orders...";


    try {


        const snapshot =
            await getDocs(
                collection(db,"orders")
            );


        if(snapshot.empty){

            adminMessage.textContent =
                "No orders found.";

            return;

        }



        const orders = [];


        snapshot.forEach((doc)=>{

            orders.push({

                id:doc.id,

                ...doc.data()

            });

        });



        orders.sort((a,b)=>{

            return new Date(b.date || 0)
            -
            new Date(a.date || 0);

        });



        adminMessage.textContent =
            orders.length +
            " order(s) found.";



        orders.forEach((order)=>{

            displayOrder(order);

        });


    }


    catch(error){

        console.error(
            "Error loading orders:",
            error
        );


        adminMessage.textContent =
            "Unable to load orders.";

    }

}



/* =========================================
   DISPLAY ONE ORDER
========================================= */
function displayOrder(order){

    const orderCard = document.createElement("div");

    orderCard.className = "order-card";


    const customerName = order.customerName || "Customer";
    const phone = order.phone || "Not provided";
    const email = order.email || "Not provided";
    const address = order.address || "Not provided";
    const orderNumber = order.orderNumber || "BARQ0000";
  const status = order.status || "Pending";


const statusClass =
    status
    .toLowerCase()
    .replaceAll(" ", "-");


const paymentMethod = order.paymentMethod || "Not selected"; 

    const subtotal = Number(order.subtotal || 0);
    const delivery = Number(order.delivery || 0);
    const total = Number(order.total || 0);


    let orderDate = "Date not available";

    if(order.date){

        const date = new Date(order.date);

        if(!isNaN(date.getTime())){
            orderDate = date.toLocaleString();
        }

    }


    let locationHTML = `
        <span class="no-location">
            Location not available
        </span>
    `;


    if(
        order.latitude !== undefined &&
        order.longitude !== undefined
    ){

        const mapURL =
        "https://www.google.com/maps?q=" +
        order.latitude +
        "," +
        order.longitude;


        locationHTML = `
            <a 
            href="${mapURL}"
            target="_blank"
            class="location-link">
            📍 Open Customer Location
            </a>
        `;

    }



    let productsHTML = "<p>No products found.</p>";


    if(
        Array.isArray(order.items) &&
        order.items.length > 0
    ){

        productsHTML = "<ul>";

        order.items.forEach((item)=>{

            productsHTML += `
                <li>
                    <strong>${item.name}</strong>
                    <br>
                    Quantity: ${item.quantity}
                    <br>
                    Price: SAR ${Number(item.price).toFixed(2)}
                </li>
            `;

        });

        productsHTML += "</ul>";

    }



    const statusHTML = `

    <select 
    class="status-select"
    data-order-id="${order.id}">

    <option value="Pending" ${status==="Pending"?"selected":""}>
    Pending
    </option>

    <option value="Processing" ${status==="Processing"?"selected":""}>
    Processing
    </option>

    <option value="Shipped" ${status==="Shipped"?"selected":""}>
    Shipped
    </option>

    <option value="Out for Delivery" ${status==="Out for Delivery"?"selected":""}>
    Out for Delivery
    </option>

    <option value="Delivered" ${status==="Delivered"?"selected":""}>
    Delivered
    </option>

    <option value="Delivery Delayed" ${status==="Delivery Delayed"?"selected":""}>
    Delivery Delayed
    </option>

    <option value="Replacement Requested" ${status==="Replacement Requested"?"selected":""}>
    Replacement Requested
    </option>

    <option value="Replacement Approved" ${status==="Replacement Approved"?"selected":""}>
    Replacement Approved
    </option>

    <option value="Cancelled" ${status==="Cancelled"?"selected":""}>
    Cancelled
    </option>

    </select>

    `;



    orderCard.innerHTML = `

    <div class="order-card-header">

        <div>

            <h3>${orderNumber}</h3>

            <p>${orderDate}</p>

        </div>

    </div>


    <div class="customer-section">

        <h4>Customer Information</h4>

        <p><strong>Name:</strong> ${customerName}</p>

        <p><strong>Phone:</strong> ${phone}</p>

        <p><strong>Email:</strong> ${email}</p>

        <p><strong>Address:</strong> ${address}</p>


        <div class="location-box">

        <strong>Customer Location:</strong>

        <br>

        ${locationHTML}

        </div>

    </div>



    <div class="products-section">

        <h4>Products</h4>

        ${productsHTML}

    </div>



    <div class="payment-section">

        <h4>Payment</h4>

        <p><strong>Method:</strong> ${paymentMethod}</p>

        <p><strong>Subtotal:</strong> SAR ${subtotal.toFixed(2)}</p>

        <p><strong>Delivery:</strong> SAR ${delivery.toFixed(2)}</p>

        <p class="order-total">

        <strong>Total:</strong>
        SAR ${total.toFixed(2)}

        </p>


    </div>


    <div class="status-section">

        <h4>Status</h4>

        ${statusHTML}

    </div>

    `;


    ordersContainer.appendChild(orderCard);

}


/* =========================================
   UPDATE STATUS
========================================= */


document.addEventListener(
"change",
async function(event){


    if(
        event.target.classList.contains(
            "status-select"
        )
    ){


        const orderId =
            event.target.dataset.orderId;


        const newStatus =
            event.target.value;



        try{


            await updateDoc(

                doc(
                    db,
                    "orders",
                    orderId
                ),

                {

                    status:newStatus

                }

            );


            console.log(
                "Status updated:",
                newStatus
            );


        }


        catch(error){


            console.error(
                "Status update error:",
                error
            );


            alert(
                "Unable to update status."
            );


        }


    }


});





/* =========================================
   REFRESH
========================================= */


if(refreshButton){


    refreshButton.addEventListener(
        "click",
        loadOrders
    );


}






/* =========================================
   LOGOUT
========================================= */


if(logoutButton){


    logoutButton.addEventListener(
        "click",
        async function(){


            try{


                await signOut(auth);



                window.location.href =
                    "index.html";


            }


            catch(error){


                console.error(
                    "Logout error:",
                    error
                );


            }


        }
    );


}
