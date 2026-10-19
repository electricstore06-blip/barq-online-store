```javascript
import { auth, db } from "./firebase-config.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const messageEl = document.getElementById("admin-message");
const sectionEl = document.getElementById("reviews-section");
const containerEl = document.getElementById("reviews-container");
const filterEl = document.getElementById("status-filter");
const refreshBtn = document.getElementById("refresh-btn");

let isAuthorizedAdmin = false;

function showMessage(message) {
  messageEl.textContent = message;
}

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "Date unavailable";
  }

  return timestamp.toDate().toLocaleString();
}

function safeText(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function addReviewButton(actions, label, className, callback) {
  const button = createElement("button", className, label);
  button.type = "button";

  button.addEventListener("click", async () => {
    if (!isAuthorizedAdmin) {
      showMessage("Admin authorization is required.");
      return;
    }

    const buttons = actions.querySelectorAll("button");
    buttons.forEach(item => {
      item.disabled = true;
    });

    try {
      await callback();
```
