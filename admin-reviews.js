
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
      await loadReviews();
    } catch (error) {
      console.error("Review action failed:", error);
      showMessage(
        "The action failed. Check your admin access and Firestore rules."
      );

      buttons.forEach(item => {
        item.disabled = false;
      });
    }
  });

  actions.appendChild(button);
}

function renderReview(reviewId, review) {
  const card = createElement("article", "review-card");

  const productName = safeText(
    review.productName || review.productTitle,
    review.productId || "Unknown product"
  );

  card.appendChild(
    createElement("h3", "", productName)
  );

  const meta = createElement("div", "review-meta");

  meta.textContent = [
    `Customer: ${safeText(review.firstName, "Customer")}`,
    `Status: ${safeText(review.status, "unknown")}`,
    `Submitted: ${formatDate(review.createdAt)}`,
    `Verified purchase: ${review.verifiedPurchase === true ? "Yes" : "No"}`,
    `Product ID: ${safeText(review.productId, "Unavailable")}`,
    `Order ID: ${safeText(review.orderId, "Unavailable")}`
  ].join(" | ");

  card.appendChild(meta);

  const rating = Number(review.rating);
  const validRating =
    Number.isInteger(rating) && rating >= 1 && rating <= 5;

  card.appendChild(
    createElement(
      "div",
      "review-rating",
      validRating ? `${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)` : "Rating unavailable"
    )
  );

  card.appendChild(
    createElement(
      "p",
      "review-comment",
      safeText(review.comment, "No written comment.")
    )
  );

  const actions = createElement("div", "review-actions");

  if (review.status !== "approved") {
    addReviewButton(actions, "Approve", "approve-btn", async () => {
      await updateDoc(doc(db, "productReviews", reviewId), {
        status: "approved",
        updatedAt: serverTimestamp()
      });

      showMessage("Review approved.");
    });
  }

  if (review.status !== "rejected") {
    addReviewButton(actions, "Reject", "reject-btn", async () => {
      await updateDoc(doc(db, "productReviews", reviewId), {
        status: "rejected",
        updatedAt: serverTimestamp()
      });

      showMessage("Review rejected.");
    });
  }

  addReviewButton(actions, "Delete", "delete-btn", async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this review?"
    );

    if (!confirmed) {
      return;
    }

    await deleteDoc(doc(db, "productReviews", reviewId));
    showMessage("Review deleted.");
  });

  card.appendChild(actions);

  return card;
}

async function loadReviews() {
  if (!isAuthorizedAdmin) {
    return;
  }

  containerEl.replaceChildren();
  showMessage("Loading reviews...");
  refreshBtn.disabled = true;
  filterEl.disabled = true;

  try {
    const selectedStatus = filterEl.value;
    const reviewsRef = collection(db, "productReviews");

    const reviewsQuery =
      selectedStatus === "all"
        ? query(reviewsRef)
        : query(reviewsRef, where("status", "==", selectedStatus));

    const snapshot = await getDocs(reviewsQuery);

    if (snapshot.empty) {
      showMessage("No reviews found for this filter.");
      return;
    }

    const reviews = snapshot.docs.map(reviewDoc => ({
      id: reviewDoc.id,
      data: reviewDoc.data()
    }));

    reviews.sort((a, b) => {
      const aTime = a.data.createdAt?.toMillis?.() || 0;
      const bTime = b.data.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    const fragment = document.createDocumentFragment();

    for (const item of reviews) {
      fragment.appendChild(renderReview(item.id, item.data));
    }

    containerEl.appendChild(fragment);
    showMessage(`Found ${reviews.length} review(s).`);
  } catch (error) {
    console.error("Could not load customer reviews:", error);

    showMessage(
      "Reviews could not be loaded. Check the Firestore rules and browser console."
    );
  } finally {
    refreshBtn.disabled = false;
    filterEl.disabled = false;
  }
}

onAuthStateChanged(auth, async user => {
  isAuthorizedAdmin = false;
  sectionEl.hidden = true;

  if (!user) {
    showMessage(
      "Please sign in with your BARQ admin account, then reload this page."
    );
    return;
  }

  try {
    const adminRef = doc(db, "admins", user.uid);
    const adminSnapshot = await getDoc(adminRef);

    if (!adminSnapshot.exists() ||
        adminSnapshot.data().role !== "admin") {
      showMessage("Access denied. This page is for BARQ administrators only.");
      return;
    }

    isAuthorizedAdmin = true;
    sectionEl.hidden = false;

    await loadReviews();
  } catch (error) {
    console.error("Admin authorization check failed:", error);
    showMessage(
      "Could not verify admin access. Check your connection and Firestore rules."
    );
  }
});

filterEl.addEventListener("change", loadReviews);
refreshBtn.addEventListener("click", loadReviews);
```
