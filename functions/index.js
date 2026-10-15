
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

async function requireUser(request) {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Please log in first."
    );
  }

  return request.auth.uid;
}

async function requireAdmin(uid) {
  const adminSnapshot = await db.collection("admins").doc(uid).get();

  if (
    !adminSnapshot.exists ||
    adminSnapshot.data().role !== "admin"
  ) {
    throw new HttpsError(
      "permission-denied",
      "Administrator access is required."
    );
  }
}

function validateRating(rating) {
  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Rating must be between 1 and 5."
    );
  }
}

function validateComment(comment) {
  if (
    typeof comment !== "string" ||
    comment.trim().length < 1 ||
    comment.trim().length > 2000
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Review must contain between 1 and 2000 characters."
    );
  }
}

async function verifyDeliveredProduct(uid, orderId, productId) {
  if (
    typeof orderId !== "string" ||
    typeof productId !== "string" ||
    !orderId ||
    !productId
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Order ID and product ID are required."
    );
  }

  const orderSnapshot = await db.collection("orders").doc(orderId).get();

  if (!orderSnapshot.exists) {
    throw new HttpsError(
      "not-found",
      "Order was not found."
    );
  }

  const order = orderSnapshot.data();

  if (order.customerUid !== uid) {
    throw new HttpsError(
      "permission-denied",
      "This order does not belong to you."
    );
  }

  if (order.status !== "Delivered") {
    throw new HttpsError(
      "failed-precondition",
      "You can review products only after delivery."
    );
  }

  const hasProduct = Array.isArray(order.items) &&
    order.items.some(item =>
      item &&
      item.productId === productId
    );

  if (!hasProduct) {
    throw new HttpsError(
      "failed-precondition",
      "This product is not included in the order."
    );
  }

  return order;
}

function makeProductReviewId(uid, productId) {
  return `${uid}_${productId}`;
}

exports.submitProductReview = onCall(async request => {
  const uid = await requireUser(request);

  const {
    orderId,
    productId,
    rating,
    comment
  } = request.data || {};

  validateRating(rating);
  validateComment(comment);

  await verifyDeliveredProduct(uid, orderId, productId);

  const reviewId = makeProductReviewId(uid, productId);
  const reviewRef = db.collection("productReviews").doc(reviewId);

  const userSnapshot = await db.collection("users").doc(uid).get();

  const displayName =
    userSnapshot.exists &&
    typeof userSnapshot.data().firstName === "string"
      ? userSnapshot.data().firstName.trim().slice(0, 80)
      : "";

  await db.runTransaction(async transaction => {
    const existingReview = await transaction.get(reviewRef);

    if (existingReview.exists) {
      throw new HttpsError(
        "already-exists",
        "You have already reviewed this product. Edit your existing review."
      );
    }

    transaction.set(reviewRef, {
      userId: uid,
      firstName: displayName,
      orderId,
      productId,
      rating,
      comment: comment.trim(),
      status: "pending",
      verifiedPurchase: true,
      photoPaths: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      approvedAt: null,
      moderatedBy: null
    });
  });

  return {
    success: true,
    reviewId,
    status: "pending",
    message: "Your review was submitted for admin approval."
  };
});

exports.updateProductReview = onCall(async request => {
  const uid = await requireUser(request);

  const {
    productId,
    rating,
    comment
  } = request.data || {};

  if (typeof productId !== "string" || !productId) {
    throw new HttpsError(
      "invalid-argument",
      "Product ID is required."
    );
  }

  validateRating(rating);
  validateComment(comment);

  const reviewId = makeProductReviewId(uid, productId);
  const reviewRef = db.collection("productReviews").doc(reviewId);

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(reviewRef);

    if (!snapshot.exists || snapshot.data().userId !== uid) {
      throw new HttpsError(
        "not-found",
        "Your review was not found."
      );
    }

    transaction.update(reviewRef, {
      rating,
      comment: comment.trim(),
      status: "pending",
      approvedAt: null,
      moderatedBy: null,
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  return {
    success: true,
    status: "pending",
    message: "Your edited review is awaiting admin approval."
  };
});

exports.deleteProductReview = onCall(async request => {
  const uid = await requireUser(request);
  const { productId } = request.data || {};

  if (typeof productId !== "string" || !productId) {
    throw new HttpsError(
      "invalid-argument",
      "Product ID is required."
    );
  }

  const reviewId = makeProductReviewId(uid, productId);
  const reviewRef = db.collection("productReviews").doc(reviewId);

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(reviewRef);

    if (!snapshot.exists || snapshot.data().userId !== uid) {
      throw new HttpsError(
        "not-found",
        "Your review was not found."
      );
    }

    transaction.delete(reviewRef);
  });

  return {
    success: true,
    message: "Review deleted."
  };
});

exports.submitStoreReview = onCall(async request => {
  const uid = await requireUser(request);

  const { rating, comment } = request.data || {};

  validateRating(rating);
  validateComment(comment);

  const ordersSnapshot = await db.collection("orders")
    .where("customerUid", "==", uid)
    .where("status", "==", "Delivered")
    .limit(1)
    .get();

  if (ordersSnapshot.empty) {
    throw new HttpsError(
      "failed-precondition",
      "A delivered order is required to review the store."
    );
  }

  const reviewRef = db.collection("storeReviews").doc(uid);

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(reviewRef);

    if (snapshot.exists) {
      throw new HttpsError(
        "already-exists",
        "You already have a store review. Edit your existing review."
      );
    }

    const userSnapshot = await transaction.get(
      db.collection("users").doc(uid)
    );

    const firstName =
      userSnapshot.exists &&
      typeof userSnapshot.data().firstName === "string"
        ? userSnapshot.data().firstName.trim().slice(0, 80)
        : "";

    transaction.set(reviewRef, {
      userId: uid,
      firstName,
      rating,
      comment: comment.trim(),
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      approvedAt: null,
      moderatedBy: null
    });
  });

  return {
    success: true,
    status: "pending",
    message: "Your store review is awaiting admin approval."
  };
});

exports.moderateReview = onCall(async request => {
  const uid = await requireUser(request);
  await requireAdmin(uid);

  const {
    reviewType,
    reviewId,
    action
  } = request.data || {};

  const collectionName = {
    product: "productReviews",
    store: "storeReviews"
  }[reviewType];

  if (
    !collectionName ||
    typeof reviewId !== "string" ||
    !["approve", "reject"].includes(action)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Review type, review ID, or action is invalid."
    );
  }

  const reviewRef = db.collection(collectionName).doc(reviewId);

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(reviewRef);

    if (!snapshot.exists) {
      throw new HttpsError(
        "not-found",
        "Review not found."
      );
    }

    const review = snapshot.data();

    if (review.status !== "pending") {
      throw new HttpsError(
        "failed-precondition",
        "Only pending reviews can be moderated."
      );
    }

    transaction.update(reviewRef, {
      status: action === "approve" ? "approved" : "rejected",
      approvedAt: action === "approve"
        ? FieldValue.serverTimestamp()
        : null,
      moderatedBy: uid,
      moderatedAt: FieldValue.serverTimestamp()
    });
  });

  return {
    success: true,
    status: action === "approve" ? "approved" : "rejected"
  };
});

