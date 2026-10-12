import { auth, db } from "./firebase-config.js";

import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const ordersContainer = document.getElementById("orders-container");

if (!ordersContainer) {
    console.error('Could not find the element with id="orders-container".');
}

function showMessage(message) {
    if (ordersContainer) {
        ordersContainer.textContent = message;
    }
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        showMessage("Please log in to view your orders.");
        return;
    }

    showMessage("Loading your orders...");

    const ordersQuery = query(
        collection(db, "orders"),
        where("customerUid", "==", user.uid),
        orderBy("createdAt", "desc")
    );

    onSnapshot(
        ordersQuery,
        (snapshot) => {
            if (snapshot.empty) {
                showMessage("You don't have any orders yet.");
                return;
            }

            ordersContainer.replaceChildren();

            snapshot.forEach((orderDoc) => {
                const order = orderDoc.data();

                const card = document.createElement("div");
                card.className = "order-card";

                const number = document.createElement("p");
                number.textContent = `Order Number: ${order.orderNumber || orderDoc.id}`;

                const items = document.createElement("p");
                const itemNames = Array.isArray(order.items)
                    ? order.items.map(item => item.name || item.title || "Product").join(", ")
                    : "Order items";

                items.textContent = `Items: ${itemNames}`;

                const total = document.createElement("p");
                total.textContent = `Total: SAR ${Number(order.total || 0).toFixed(2)}`;

                const status = document.createElement("p");
                status.textContent = `Status: ${order.status || "Pending"}`;

                card.append(number, items, total, status);
                ordersContainer.appendChild(card);
            });
        },
        (error) => {
            console.error("Error loading customer orders:", error);
            showMessage("Unable to load orders. Please try again later.");
        }
    );
});
