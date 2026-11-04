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
let activeSection = "all";
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
   EXPORT BUTTONS AND STYLES
========================================= */

function addExportStyles() {
  if ($("barq-export-styles")) return;

  const style = document.createElement("style");
  style.id = "barq-export-styles";

  style.textContent = `
    .barq-export-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 18px 0;
    }

    .barq-action-btn {
      border: 1px solid #c6a15b;
      background: #111;
      color: #fff;
      padding: 11px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }

    .barq-action-btn:hover {
      background: #c6a15b;
      color: #111;
    }

    .barq-order-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin: 16px 0;
    }

    .barq-order-actions .barq-action-btn {
      padding: 9px 13px;
    }

    @media print {
      .barq-export-toolbar,
      .barq-order-actions,
      .status-section,
      .order-sections,
      header,
      button {
        display: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function addExportToolbar() {
  if ($("barq-export-toolbar")) return;

  addExportStyles();

  const toolbar = document.createElement("div");
  toolbar.id = "barq-export-toolbar";
  toolbar.className = "barq-export-toolbar";

  toolbar.innerHTML = `
    <button type="button" class="barq-action-btn" data-export="pdf">
      Export Orders PDF
    </button>

    <button type="button" class="barq-action-btn" data-export="csv">
      Export Excel / CSV
    </button>

    <button type="button" class="barq-action-btn" data-export="whatsapp">
      Share Order List on WhatsApp
    </button>
  `;

  ordersContainer.parentNode.insertBefore(toolbar, ordersContainer);
}

addExportToolbar();

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
   PRINT WINDOW HELPER
========================================= */

function openPrintWindow(title, content) {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("Please allow pop-ups for this website, then try again.");
    return;
  }

  printWindow.document.open();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${safeText(title)}</title>

      <style>
        * {
          box-sizing: border-box;
        }

        body {
          font-family: Arial, sans-serif;
          color: #222;
          margin: 30px;
          background: #fff;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #c6a15b;
          padding-bottom: 18px;
          margin-bottom: 25px;
        }

        .brand {
          font-size: 30px;
          font-weight: 800;
          color: #111;
          letter-spacing: 2px;
        }

        .brand-subtitle {
          color: #9b7a3f;
          font-size: 11px;
          letter-spacing: 3px;
          margin-top: 5px;
        }

        h2 {
          color: #111;
          margin-top: 25px;
          font-size: 16px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .info-box {
          background: #fbfaf7;
          border: 1px solid #eee6d7;
          border-radius: 8px;
          padding: 14px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }

        th {
          background: #111;
          color: #fff;
          padding: 11px;
          text-align: left;
        }

        td {
          padding: 11px;
          border-bottom: 1px solid #eee;
        }

        .totals {
          width: 320px;
          max-width: 100%;
          margin-left: auto;
          margin-top: 22px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }

        .grand-total {
          border-top: 2px solid #c6a15b;
          font-size: 19px;
          font-weight: 800;
          padding-top: 12px;
        }

        .footer {
          text-align: center;
          border-top: 1px solid #ddd;
          margin-top: 40px;
          padding-top: 15px;
          color: #777;
          font-size: 12px;
        }

        @media print {
          body {
            margin: 12mm;
          }
        }

        @media (max-width: 600px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>

    <body>
      ${content}
    </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

/* =========================================
   INDIVIDUAL INVOICE
========================================= */

function printInvoice(order) {
  const items = getItems(order);

  const productsHTML = items.map(item => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;

    return `
      <tr>
        <td>${safeText(item.name || "Product")}</td>
        <td>${quantity}</td>
        <td>${money(price)}</td>
        <td>${money(price * quantity)}</td>
      </tr>
    `;
  }).join("");

  const calculatedSubtotal = items.reduce((sum, item) => {
    return sum +
      (Number(item.price) || 0) *
      (Number(item.quantity) || 0);
  }, 0);

  const subtotal = order.subtotal ?? calculatedSubtotal;
  const delivery = Number(order.delivery) || 0;
  const total = order.total ?? (Number(subtotal) + delivery);

  const content = `
    <div class="invoice-header">
      <div>
        <div class="brand">BARQ</div>
        <div class="brand-subtitle">ONLINE STORE</div>
      </div>

      <div style="text-align:right">
        <h1 style="margin:0">INVOICE</h1>
        <p><strong>Order:</strong> ${safeText(getOrderNumber(order))}</p>
        <p><strong>Date:</strong> ${safeText(formatDate(order))}</p>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <h2>Customer Details</h2>
        <div class="info-box">
          <strong>${safeText(getCustomerName(order))}</strong><br>
          Phone: ${safeText(order.phone || "Not provided")}<br>
          Email: ${safeText(order.email || "Not provided")}<br>
          Address: ${safeText(order.address || "Not provided")}
        </div>
      </div>

      <div>
        <h2>Order Details</h2>
        <div class="info-box">
          Order Number: ${safeText(getOrderNumber(order))}<br>
          Status: ${safeText(getStatus(order))}<br>
          Payment Method: ${safeText(order.paymentMethod || "Not selected")}
        </div>
      </div>
    </div>

    <h2>Order Items</h2>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>

      <tbody>
        ${productsHTML || `
          <tr><td colspan="4">No products found</td></tr>
        `}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <strong>${money(subtotal)}</strong>
      </div>

      <div class="total-row">
        <span>Delivery</span>
        <strong>${money(delivery)}</strong>
      </div>

      <div class="total-row grand-total">
        <span>Total</span>
        <strong>${money(total)}</strong>
      </div>
    </div>

    <div class="footer">
      Thank you for shopping with BARQ Online Store.
    </div>
  `;

  openPrintWindow("BARQ Invoice - " + getOrderNumber(order), content);
}

/* =========================================
   INDIVIDUAL WHATSAPP SHARE
========================================= */

function shareOrderWhatsApp(order) {
  const message = [
    "BARQ ONLINE STORE",
    "Order: " + getOrderNumber(order),
    "Customer: " + getCustomerName(order),
    "Date: " + formatDate(order),
    "Status: " + getStatus(order),
    "Payment: " + (order.paymentMethod || "Not selected"),
    "Total: " + money(order.total)
  ].join("\n");

  window.open(
    "https://wa.me/?text=" + encodeURIComponent(message),
    "_blank",
    "noopener,noreferrer"
  );
}

/* =========================================
   BULK EXPORT: CSV FOR EXCEL
========================================= */

function csvCell(value) {
  let text = String(value ?? "");

  // Protect spreadsheet users from formula injection.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = "'" + text;
  }

  return '"' + text.replace(/"/g, '""') + '"';
}

function exportOrdersCSV(orders) {
  const headers = [
    "Order Number",
    "Date",
    "Customer",
    "Phone",
    "Email",
    "Address",
    "Products",
    "Payment Method",
    "Subtotal",
    "Delivery",
    "Total",
    "Status"
  ];

  const rows = orders.map(order => {
    const products = getItems(order).map(item =>
      `${item.name || "Product"} x ${Number(item.quantity) || 0}`
    ).join("; ");

    return [
      getOrderNumber(order),
      formatDate(order),
      getCustomerName(order),
      order.phone || "",
      order.email || "",
      order.address || "",
      products,
      order.paymentMethod || "",
      order.subtotal ?? "",
      order.delivery ?? "",
      order.total ?? "",
      getStatus(order)
    ];
  });

  const csv = [
    headers,
    ...rows
  ].map(row => row.map(csvCell).join(",")).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "BARQ-orders-" + new Date().toISOString().slice(0, 10) + ".csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/* =========================================
   BULK EXPORT: PDF / PRINT
========================================= */

function exportOrdersPDF(orders) {
  const rows = orders.map(order => `
    <tr>
      <td>${safeText(getOrderNumber(order))}</td>
      <td>${safeText(getCustomerName(order))}</td>
      <td>${safeText(formatDate(order))}</td>
      <td>${safeText(getStatus(order))}</td>
      <td>${money(order.total)}</td>
    </tr>
  `).join("");

  const content = `
    <div class="invoice-header">
      <div>
        <div class="brand">BARQ</div>
        <div class="brand-subtitle">ONLINE STORE</div>
      </div>

      <div style="text-align:right">
        <h1>ORDERS REPORT</h1>
        <p>Generated: ${safeText(new Date().toLocaleString())}</p>
        <p>Total orders: ${orders.length}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Order Number</th>
          <th>Customer</th>
          <th>Date</th>
          <th>Status</th>
          <th>Total</th>
        </tr>
      </thead>

      <tbody>
        ${rows || `<tr><td colspan="5">No orders found</td></tr>`}
      </tbody>
    </table>

    <div class="footer">
      BARQ Online Store — Orders Report
    </div>
  `;

  openPrintWindow("BARQ Orders Report", content);
}

/* =========================================
   BULK WHATSAPP SHARE
========================================= */

function shareOrdersWhatsApp(orders) {
  if (!orders.length) {
    alert("There are no orders to share.");
    return;
  }

  const lines = [
    "BARQ ONLINE STORE - ORDER LIST",
    "Orders: " + orders.length,
    ""
  ];

  orders.forEach((order, index) => {
    lines.push(
      `${index + 1}. ${getOrderNumber(order)} | ` +
      `${getCustomerName(order)} | ` +
      `${getStatus(order)} | ` +
      `${money(order.total)}`
    );
  });

  const message = lines.join("\n");

  window.open(
    "https://wa.me/?text=" + encodeURIComponent(message),
    "_blank",
    "noopener,noreferrer"
  );
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

    if (
      !adminSnapshot.exists() ||
      adminSnapshot.data().role !== "admin"
    ) {
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
    statusFilter.value = "all";

    document.querySelectorAll(".section-btn").forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");
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

  $("stat-total").textContent = allOrders.length;
  $("stat-pending").textContent = count("Pending");
  $("stat-processing").textContent = count("Processing");
  $("stat-delivered").textContent = count("Delivered");

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

    if (search && !searchableText.includes(search)) {
      return false;
    }

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

    if (
      selectedStatus !== "all" &&
      orderStatus !== selectedStatus
    ) {
      return false;
    }

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

      <div class="barq-order-actions">
        <button type="button"
          class="barq-action-btn"
          data-order-action="invoice"
          data-order-id="${safeText(order.id)}">
          Print Invoice / Save PDF
        </button>

        <button type="button"
          class="barq-action-btn"
          data-order-action="whatsapp"
          data-order-id="${safeText(order.id)}">
          Share on WhatsApp
        </button>
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
   EXPORT BUTTON EVENTS
========================================= */

document.addEventListener("click", event => {
  const exportButton = event.target.closest("[data-export]");

  if (exportButton) {
    if (!authorizedUid) {
      alert("Administrator access is required.");
      return;
    }

    const orders = getFilteredOrders();
    const action = exportButton.dataset.export;

    if (!orders.length) {
      alert("There are no orders to export.");
      return;
    }

    if (action === "pdf") {
      exportOrdersPDF(orders);
    }

    if (action === "csv") {
      exportOrdersCSV(orders);
    }

    if (action === "whatsapp") {
      shareOrdersWhatsApp(orders);
    }

    return;
  }

  const orderButton = event.target.closest("[data-order-action]");

  if (!orderButton) return;

  if (!authorizedUid) {
    alert("Administrator access is required.");
    return;
  }

  const order = allOrders.find(item =>
    item.id === orderButton.dataset.orderId
  );

  if (!order) {
    alert("Order not found. Please refresh the page.");
    return;
  }

  if (orderButton.dataset.orderAction === "invoice") {
    printInvoice(order);
  }

  if (orderButton.dataset.orderAction === "whatsapp") {
    shareOrderWhatsApp(order);
  }
});

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
