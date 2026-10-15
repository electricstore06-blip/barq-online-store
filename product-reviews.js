// BARQ Online Store — Product Reviews
// This is a new file. It does not replace existing BARQ code.

import { auth, db } from "./firebase-config.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const functions = getFunctions();

const submitProductReview = httpsCallable(
  functions,
  "submitProductReview"
);

let currentProductId = null;
let reviewSection = null;

function getProductId() {
  const params = new URLSearchParams(window.location.search);

  return (
    params.get("productId") ||
    params.get("id") ||
    params.get("product")
  );
}

function createElement(tag, text = "") {
  const element = document.createElement(tag);

  if (text) {
    element.textContent = text;
  }

  return element;
}

function showMessage(message, isError = false) {
  const messageElement = reviewSection?.querySelector(
    "#barq-review-message"
  );

  if (!messageElement) return;

  messageElement.textContent = message;
  messageElement.style.color = isError ? "#b00020" : "#176b36";
}

function renderReviewSection() {
  const existingSection = document.getElementById(
    "barq-product-reviews"
  );

  if (existingSection) {
    reviewSection = existingSection;
    return;
  }

  const productContainer = document.getElementById("productDetails");

  if (!productContainer) {
    console.error(
      "BARQ Reviews: Could not find #productDetails."
    );
    return;
  }

  reviewSection = createElement("section");
  reviewSection.id = "barq-product-reviews";

  reviewSection.style.cssText = `
    margin: 30px 0;
    padding: 20px;
    border: 1px solid #e2e2e2;
    border-radius: 12px;
    background: #ffffff;
  `;

  const heading = createElement("h2", "Customer Reviews");

  const summary = createElement("p");
  summary.id = "barq-review-summary";
  summary.textContent = "Loading reviews...";

  const distribution = createElement("div");
  distribution.id = "barq-review-distribution";

  const sortingLabel = createElement("label", "Sort reviews: ");
  sortingLabel.htmlFor = "barq-review-sort";

  const sorting = createElement("select");
  sorting.id = "barq-review-sort";

  const newestOption = createElement("option", "Newest first");
  newestOption.value = "newest";

  const highestOption = createElement("option", "Highest rated");
  highestOption.value = "highest";

  sorting.append(newestOption, highestOption);

  const reviewList = createElement("div");
  reviewList.id = "barq-review-list";

  const formHeading = createElement("h3", "Write a Review");

  const loginNotice = createElement("p");
  loginNotice.id = "barq-review-login-notice";

  const form = createElement("form");
  form.id = "barq-review-form";

  const orderLabel = createElement(
    "label",
    "Select your delivered order:"
  );
  orderLabel.htmlFor = "barq-review-order";

  const orderSelect = createElement("select");
  orderSelect.id = "barq-review-order";
  orderSelect.required = true;

  const placeholder = createElement("option", "Choose an order");
  placeholder.value = "";

  orderSelect.appendChild(placeholder);

  const ratingLabel = createElement("label", "Rating:");
  ratingLabel.htmlFor = "barq-review-rating";

  const ratingSelect = createElement("select");
  ratingSelect.id = "barq-review-rating";
  ratingSelect.required = true;

  for (let rating = 5; rating >= 1; rating--) {
    const option = createElement(
      "option",
      `${"★".repeat(rating)} (${rating}/5)`
    );

    option.value = String(rating);
    ratingSelect.appendChild(option);
  }

  const commentLabel = createElement(
    "label",
    "Your review:"
  );
  commentLabel.htmlFor = "barq-review-comment";

  const comment = createElement("textarea");
  comment.id = "barq-review-comment";
  comment.required = true;
  comment.minLength = 1;
  comment.maxLength = 2000;
  comment.rows = 5;
  comment.placeholder = "Tell us about this product...";

  const submitButton = createElement(
    "button",
    "Submit Review"
  );

  submitButton.type = "submit";

  const message = createElement("p");
  message.id = "barq-review-message";
  message.setAttribute("role", "status");

  form.append(
    orderLabel,
    orderSelect,
    document.createElement("br"),
    ratingLabel,
    ratingSelect,
    document.createElement("br"),
    commentLabel,
    comment,
    document.createElement("br"),
    submitButton,
    message
  );

  reviewSection.append(
    heading,
    summary,
    distribution,
    sortingLabel,
    sorting,
    reviewList,
    formHeading,
    loginNotice,
    form
  );

  productContainer.insertAdjacentElement(
    "afterend",
    reviewSection
  );

  sorting.addEventListener("change", loadReviews);

  form.addEventListener("submit", handleReviewSubmit);
}

async function loadReviews() {
  if (!reviewSection || !currentProductId) return;

  const summary = reviewSection.querySelector(
    "#barq-review-summary"
  );

  const distribution = reviewSection.querySelector(
    "#barq-review-distribution"
  );

  const reviewList = reviewSection.querySelector(
    "#barq-review-list"
  );

  summary.textContent = "Loading reviews...";
  distribution.replaceChildren();
  reviewList.replaceChildren();

  try {
    const reviewsQuery = query(
      collection(db, "productReviews"),
      where("productId", "==", currentProductId),
      where("status", "==", "approved")
    );

    const snapshot = await getDocs(reviewsQuery);

    const reviews = snapshot.docs.map(documentSnapshot => ({
      id: documentSnapshot.id,
      ...documentSnapshot.data()
    }));

    const sortMode = reviewSection.querySelector(
      "#barq-review-sort"
    ).value;

    reviews.sort((a, b) => {
      if (sortMode === "highest") {
        return (b.rating || 0) - (a.rating || 0);
      }

      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;

      return bTime - aTime;
    });

    const total = reviews.length;

    const average = total
      ? reviews.reduce(
          (sum, review) => sum + (review.rating || 0),
          0
        ) / total
      : 0;

    summary.textContent = total
      ? `★ ${average.toFixed(1)} / 5 — ${total} review(s)`
      : "No approved reviews yet. Be the first to review this product!";

    for (let rating = 5; rating >= 1; rating--) {
      const count = reviews.filter(
        review => review.rating === rating
      ).length;

      const row = createElement(
        "p",
        `${rating} ★ — ${count} review(s)`
      );

      distribution.appendChild(row);
    }

    for (const review of reviews) {
      const card = createElement("article");

      card.style.cssText = `
        padding: 15px 0;
        border-bottom: 1px solid #eeeeee;
      `;

      const name = createElement(
        "strong",
        review.firstName || "Customer"
      );

      const verified = review.verifiedPurchase
        ? createElement("span", " · Verified Purchase")
        : null;

      const stars = createElement(
        "p",
        `${"★".repeat(review.rating || 0)}${"☆".repeat(
          5 - (review.rating || 0)
        )}`
      );

      const comment = createElement(
        "p",
        review.comment || ""
      );

      card.append(name);

      if (verified) {
        verified.style.color = "#176b36";
        card.appendChild(verified);
      }

      card.append(stars, comment);
      reviewList.appendChild(card);
    }
  } catch (error) {
    console.error("BARQ Reviews: Could not load reviews.", error);

    summary.textContent =
      "Reviews could not be loaded. Please try again later.";
  }
}

async function loadDeliveredOrders(user) {
  const orderSelect = reviewSection.querySelector(
    "#barq-review-order"
  );

  const form = reviewSection.querySelector(
    "#barq-review-form"
  );

  const notice = reviewSection.querySelector(
    "#barq-review-login-notice"
  );

  orderSelect.replaceChildren(
    createElement("option", "Loading your orders...")
  );

  try {
    const ordersQuery = query(
      collection(db, "orders"),
      where("customerUid", "==", user.uid),
      where("status", "==", "Delivered")
    );

    const snapshot = await getDocs(ordersQuery);

    orderSelect.replaceChildren();

    const placeholder = createElement(
      "option",
      "Choose a delivered order"
    );

    placeholder.value = "";
    orderSelect.appendChild(placeholder);

    let eligibleOrders = 0;

    snapshot.forEach(orderDocument => {
      const order = orderDocument.data();

      const containsProduct = Array.isArray(order.items) &&
        order.items.some(item =>
          item && item.productId === currentProductId
        );

      if (!containsProduct) return;

      eligibleOrders++;

      const option = createElement(
        "option",
        order.orderNumber
          ? `Order ${order.orderNumber}`
          : `Order ${orderDocument.id}`
      );

      option.value = orderDocument.id;

      orderSelect.appendChild(option);
    });

    if (!eligibleOrders) {
      notice.textContent =
        "You can review this product after it has been delivered to you.";

      form.hidden = true;
    } else {
      notice.textContent =
        "Your delivered order has been verified.";

      form.hidden = false;
    }
  } catch (error) {
    console.error("BARQ Reviews: Could not load orders.", error);

    notice.textContent =
      "We could not check your orders. Please try again later.";

    form.hidden = true;
  }
}

async function handleReviewSubmit(event) {
  event.preventDefault();

  const user = auth.currentUser;

  if (!user) {
    showMessage("Please log in before submitting a review.", true);
    return;
  }

  const orderId = reviewSection.querySelector(
    "#barq-review-order"
  ).value;

  const rating = Number(
    reviewSection.querySelector("#barq-review-rating").value
  );

  const comment = reviewSection.querySelector(
    "#barq-review-comment"
  ).value.trim();

  if (!orderId) {
    showMessage("Please select a delivered order.", true);
    return;
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    showMessage("Please select a rating from 1 to 5.", true);
    return;
  }

  if (!comment || comment.length > 2000) {
    showMessage(
      "Please enter a review of up to 2000 characters.",
      true
    );
    return;
  }

  const submitButton = reviewSection.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = true;
  showMessage("Submitting your review...");

  try {
    await submitProductReview({
      orderId,
      productId: currentProductId,
      rating,
      comment
    });

    reviewSection.querySelector(
      "#barq-review-comment"
    ).value = "";

    showMessage(
      "Thank you! Your review has been submitted for admin approval."
    );

    await loadReviews();
  } catch (error) {
    console.error("BARQ Reviews: Submission failed.", error);

    showMessage(
      error.message || "Could not submit your review.",
      true
    );
  } finally {
    submitButton.disabled = false;
  }
}

function initializeProductReviews() {
  currentProductId = getProductId();

  if (!currentProductId) {
    console.warn(
      "BARQ Reviews: No product ID was found in the page URL."
    );
    return;
  }

  renderReviewSection();

  if (!reviewSection) return;

  loadReviews();

  onAuthStateChanged(auth, user => {
    const form = reviewSection.querySelector(
      "#barq-review-form"
    );

    const notice = reviewSection.querySelector(
      "#barq-review-login-notice"
    );

    if (!user) {
      form.hidden = true;

      notice.textContent =
        "Please log in to review this product.";

      return;
    }

    loadDeliveredOrders(user);
  });
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeProductReviews
  );
} else {
  initializeProductReviews();
}
