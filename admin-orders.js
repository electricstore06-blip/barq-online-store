
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
   ELEMENTS AND STATE
========================================= */

const $ = id => document.getElementById(id);

const ordersContainer = $("orders-container");
const adminMessage = $("admin-message");
const refreshButton = $("refresh-btn");
const logoutButton = $("logout-btn");
const searchInput = $("order-search");
const statusFilter = $("status-filter");
const dateFilter = $("date-filter");

let allOrders = [];
let activeSection = "Pending";
let authorizedUid = null;
let isLoading = false;

const STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Delivery Delayed",
  "Replacement Requested",
  "Replacement Approved",
  "Cancelled"
];

/* =========================================
   SAFE DISPLAY HELPERS
========================================= */

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function money(value) {
  return "SAR " + (Number(value) || 0).toFixed(2);
}

function getStatus(order) {
  return STATUSES.includes(order.status) ? order.status : "Pending";
}

function getOrderNumber(order) {
  return order.orderNumber || order.id || "BARQ0000";
}

function getDate(order) {
  if (!order.date) return null;

  let date;

  if (typeof order.date.toDate === "function") {
    date = order.date.toDate();
  } else if (typeof order.date === "object" && order.date.seconds) {
    date = new Date(order.date.seconds * 1000);
  } else {
    date = new Date(order.date);
  }

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(order) {
  const date = getDate(order);
  return date ? date.toLocaleString() : "Date not available";
}

function getCustomerName(order) {
  return order.customerName || "Customer";
}

function getItems(order) {
  return Array.isArray(order.items) ? order.items : [];
}

function getCoordinates(order) {
  const latitude = Number(order.latitude);
  const longitude = Number(order.longitude);

  if (
    order.latitude === null || order.latitude === undefined ||
    order.longitude === null || order.longitude === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

/* =========================================
   ADMIN LOGIN CHECK
========================================= */

onAuthStateChanged(auth, async user => {
  if (!user) {
    authorizedUid = null;
    window.location.href = "index.html";
    return;
  }

  try {
    adminMessage.textContent = "Checking administrator permissions...";

    const adminSnapshot = await getDoc(doc(db, "admins", user.uid));

    if (!adminSnapshot.exists() ||
        adminSnapshot.data().role !== "admin") {
      authorizedUid = null;
      alert("Access denied. You are not an administrator.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    authorizedUid = user.uid;
    await loadOrders();

  } catch (error) {
    console.error("Admin verification error:", error);
    adminMessage.textContent =
      "Unable to verify administrator access. Please refresh the page.";
  }
});
/* =========================================
   ORDER SECTION BUTTONS
========================================= */

document.querySelectorAll(".section-btn").forEach(button => {
  button.addEventListener("click", () => {
    activeSection = button.dataset.status;

    // Clear the status dropdown
    statusFilter.value = "all";

    // Highlight the selected button
    document.querySelectorAll(".section-btn").forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    // Show matching orders
    renderOrders();
  });
});
/* =========================================
   LOAD ORDERS
========================================= */

async function loadOrders() {
  if (!authorizedUid || isLoading) return;

  isLoading = true;
  refreshButton.disabled = true;
  adminMessage.textContent = "Loading orders...";
  ordersContainer.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "orders"));

    allOrders = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    allOrders.sort((a, b) => {
      return (getDate(b)?.getTime() || 0) -
             (getDate(a)?.getTime() || 0);
    });

    updateStatistics();
    renderOrders();

  } catch (error) {
    console.error("Error loading orders:", error);
    adminMessage.textContent =
      "Unable to load orders. Please check Firebase permissions and refresh.";
  } finally {
    isLoading = false;
    refreshButton.disabled = false;
  }
}

/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {
  const count = status =>
    allOrders.filter(order => getStatus(order) === status).length;

  const replacementCount = allOrders.filter(order =>
    ["Replacement Requested", "Replacement Approved"].includes(getStatus(order))
  ).length;

  // Overview cards
  $("stat-total").textContent = allOrders.length;
  $("stat-pending").textContent = count("Pending");
  $("stat-processing").textContent = count("Processing");
  $("stat-delivered").textContent = count("Delivered");

  // Section button counters
  $("count-pending").textContent = count("Pending");
  $("count-processing").textContent = count("Processing");
  $("count-shipped").textContent = count("Shipped");
  $("count-out-for-delivery").textContent = count("Out for Delivery");
  $("count-delivered").textContent = count("Delivered");
  $("count-delayed").textContent = count("Delivery Delayed");
  $("count-replacement").textContent = replacementCount;
  $("count-cancelled").textContent = count("Cancelled");
  $("count-all").textContent = allOrders.length;
}

/* =========================================
   SEARCH AND FILTERS
========================================= */
function getFilteredOrders() {
  const search = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedDate = dateFilter.value;

  const now = new Date();

  return allOrders.filter(order => {
    const orderStatus = getStatus(order);

    const searchableText = [
      getOrderNumber(order),
      getCustomerName(order),
      order.phone,
      order.email,
      order.address
    ].join(" ").toLowerCase();

    // Search filter
    if (search && !searchableText.includes(search)) {
      return false;
    }

    // Section button filter
    if (activeSection === "Replacement") {
      if (
        !["Replacement Requested", "Replacement Approved"]
          .includes(orderStatus)
      ) {
        return false;
      }
    } else if (
      activeSection !== "all" &&
      orderStatus !== activeSection
    ) {
      return false;
    }

    // Existing status dropdown filter
    if (
      selectedStatus !== "all" &&
      orderStatus !== selectedStatus
    ) {
      return false;
    }

    // Existing date filter
    const date = getDate(order);

    if (selectedDate !== "all") {
      if (!date) return false;

      const age = now.getTime() - date.getTime();

      if (selectedDate === "today") {
        if (date.toDateString() !== now.toDateString()) return false;
      }

      if (selectedDate === "7days") {
        if (age < 0 || age > 7 * 24 * 60 * 60 * 1000) return false;
      }

      if (selectedDate === "30days") {
        if (age < 0 || age > 30 * 24 * 60 * 60 * 1000) return false;
      }
    }

    return true;
  });
}
/* =========================================
   DISPLAY FILTERED ORDERS
========================================= */

function renderOrders() {
  const filteredOrders = getFilteredOrders();

  $("orders-count").textContent =
    filteredOrders.length + " of " + allOrders.length + " orders";

  if (!allOrders.length) {
    adminMessage.textContent = "No orders found.";
    ordersContainer.innerHTML = "";
    return;
  }

  if (!filteredOrders.length) {
    adminMessage.textContent =
      "No orders match your search or selected filters.";
    ordersContainer.innerHTML = "";
    return;
  }

  adminMessage.textContent =
    filteredOrders.length + " order(s) found.";

  ordersContainer.innerHTML = filteredOrders
    .map(createOrderCard)
    .join("");
}
/* =========================================
   CREATE ORDER CARD
========================================= */

function createOrderCard(order) {
  const status = getStatus(order);
  const statusClass = status.toLowerCase().replaceAll(" ", "-");

  const items = getItems(order);

  const productsHTML = items.length
    ? items.map(item => `
        <div class="product-row">
          <div class="product-info">
            <strong>${safeText(item.name || "Product")}</strong>
            <span>Quantity: ${Number(item.quantity) || 0}</span>
          </div>
          <strong>${money(item.price)}</strong>
        </div>
      `).join("")
    : `<p class="muted">No products found.</p>`;

  const coordinates = getCoordinates(order);

  const locationHTML = coordinates
    ? `<a class="location-link"
          href="https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}"
          target="_blank" rel="noopener noreferrer">
          📍 Open Customer Location
       </a>`
    : `<span class="muted">Customer location not available</span>`;

  const statusOptions = STATUSES.map(option => `
    <option value="${safeText(option)}"
      ${status === option ? "selected" : ""}>
      ${safeText(option)}
    </option>
  `).join("");

  return `
    <article class="order-card" data-order-id="${safeText(order.id)}">

      <div class="order-card-header">
        <div>
          <span class="order-label">ORDER NUMBER</span>
          <h3>${safeText(getOrderNumber(order))}</h3>
          <p class="order-date">${safeText(formatDate(order))}</p>
        </div>

        <span class="status-badge ${safeText(statusClass)}">
          ${safeText(status)}
        </span>
      </div>

      <div class="order-details-grid">

        <section class="detail-section customer-section">
          <h4>Customer Information</h4>
          <p><strong>Name:</strong> ${safeText(getCustomerName(order))}</p>
          <p><strong>Phone:</strong> ${safeText(order.phone || "Not provided")}</p>
          <p><strong>Email:</strong> ${safeText(order.email || "Not provided")}</p>
          <p><strong>Address:</strong> ${safeText(order.address || "Not provided")}</p>
          <div class="location-box">
            <strong>Customer Location</strong>
            ${locationHTML}
          </div>
        </section>

        <section class="detail-section products-section">
          <h4>Products (${items.length})</h4>
          ${productsHTML}
        </section>

        <section class="detail-section payment-section">
          <h4>Payment Summary</h4>
          <p><span>Payment method</span><strong>${safeText(order.paymentMethod || "Not selected")}</strong></p>
          <p><span>Subtotal</span><strong>${money(order.subtotal)}</strong></p>
          <p><span>Delivery</span><strong>${money(order.delivery)}</strong></p>
          <div class="order-total">
            <span>Total Amount</span>
            <strong>${money(order.total)}</strong>
          </div>
        </section>

      </div>

      <div class="status-section">
        <label for="status-${safeText(order.id)}">Update Order Status</label>
        <select
          id="status-${safeText(order.id)}"
          class="status-select ${safeText(statusClass)}"
          data-order-id="${safeText(order.id)}"
        >
          ${statusOptions}
        </select>
        <span class="status-message" aria-live="polite"></span>
      </div>

    </article>
  `;
}

/* =========================================
   UPDATE ORDER STATUS
========================================= */

document.addEventListener("change", async event => {
  if (!event.target.classList.contains("status-select")) return;

  const select = event.target;
  const orderId = select.dataset.orderId;
  const newStatus = select.value;

  if (!authorizedUid || !STATUSES.includes(newStatus)) {
    alert("Administrator access is required.");
    return;
  }

  const order = allOrders.find(item => item.id === orderId);
  if (!order) return;

  const previousStatus = getStatus(order);
  const card = select.closest(".order-card");
  const message = card?.querySelector(".status-message");

  if (newStatus === previousStatus) return;

  select.disabled = true;
  if (message) message.textContent = "Saving status...";

  try {
    await updateDoc(doc(db, "orders", orderId), {
      status: newStatus,
      statusUpdatedAt: new Date().toISOString()
    });

    order.status = newStatus;

    updateStatistics();
    renderOrders();

  } catch (error) {
    console.error("Status update error:", error);
    select.value = previousStatus;
    if (message) message.textContent = "Unable to update status.";
    alert("Unable to update order status. Please try again.");
    select.disabled = false;
  }
});

/* =========================================
   SEARCH AND FILTER EVENTS
========================================= */

searchInput.addEventListener("input", renderOrders);
statusFilter.addEventListener("change", renderOrders);
dateFilter.addEventListener("change", renderOrders);

/* =========================================
   REFRESH
========================================= */

refreshButton.addEventListener("click", loadOrders);

/* =========================================
   LOGOUT
========================================= */

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Unable to log out. Please try again.");
  }
});
