
const { onCall, HttpsError } = require("firebase-functions/v2/https");

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const adminAuth = getAuth();


// ==========================================
// AUTHENTICATION & ADMIN HELPERS
// ==========================================

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
  const adminSnapshot = await db
    .collection("admins")
    .doc(uid)
    .get();

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


// ==========================================
// REVIEW VALIDATION
// ==========================================

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


// ==========================================
// VERIFY DELIVERED PRODUCT
// ==========================================

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

  const orderSnapshot = await db
    .collection("orders")
    .doc(orderId)
    .get();

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

  const hasProduct =
    Array.isArray(order.items) &&
    order.items.some(item =>
      item && item.productId === productId
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


// ==========================================
// SUBMIT PRODUCT REVIEW
// ==========================================

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

  const reviewRef = db
    .collection("productReviews")
    .doc(reviewId);

  const userSnapshot = await db
    .collection("users")
    .doc(uid)
    .get();

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


// ==========================================
// UPDATE PRODUCT REVIEW
// ==========================================

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

  const reviewRef = db
    .collection("productReviews")
    .doc(reviewId);

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


// ==========================================
// DELETE PRODUCT REVIEW
// ==========================================

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

  const reviewRef = db
    .collection("productReviews")
    .doc(reviewId);

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


// ==========================================
// SUBMIT STORE REVIEW
// ==========================================

exports.submitStoreReview = onCall(async request => {
  const uid = await requireUser(request);

  const { rating, comment } = request.data || {};

  validateRating(rating);
  validateComment(comment);

  const ordersSnapshot = await db
    .collection("orders")
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

  const reviewRef = db
    .collection("storeReviews")
    .doc(uid);

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


// ==========================================
// MODERATE REVIEW
// ==========================================

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

  const reviewRef = db
    .collection(collectionName)
    .doc(reviewId);

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
      approvedAt:
        action === "approve"
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


// ==========================================
// CREATE STAFF ACCOUNT
// ==========================================

exports.createStaffAccount = onCall(async request => {
  const adminUid = await requireUser(request);

  await requireAdmin(adminUid);

  const {
    name,
    email,
    password,
    role,
    city,
    phone
  } = request.data || {};

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 100
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Please enter a name between 2 and 100 characters."
    );
  }

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Please enter a valid email address."
    );
  }

  if (
    typeof password !== "string" ||
    password.length < 8
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Password must contain at least 8 characters."
    );
  }

  if (!["supervisor", "driver", "staff"].includes(role)) {
    throw new HttpsError(
      "invalid-argument",
      "Role must be supervisor, driver, or staff."
    );
  }

  if (
    typeof city !== "string" ||
    city.trim().length > 100 ||
    typeof phone !== "string" ||
    phone.trim().length > 30
  ) {
    throw new HttpsError(
      "invalid-argument",
      "City or phone information is invalid."
    );
  }

  let newUser;

  try {
    newUser = await adminAuth.createUser({
      email: email.trim().toLowerCase(),
      password,
      displayName: name.trim()
    });

    await db.collection("users").doc(newUser.uid).set({
      uid: newUser.uid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      city: city.trim(),
      role,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: adminUid
    });

    return {
      success: true,
      uid: newUser.uid,
      message: "Staff account created successfully."
    };

  } catch (error) {
    if (newUser) {
      await adminAuth.deleteUser(newUser.uid).catch(cleanupError => {
        console.error(
          "Could not remove incomplete staff login:",
          cleanupError
        );
      });
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    if (error.code === "auth/email-already-exists") {
      throw new HttpsError(
        "already-exists",
        "This email address is already registered."
      );
    }

    console.error("Create staff account error:", error);

    throw new HttpsError(
      "internal",
      "Could not create the staff account."
    );
  }
});


// ==========================================
// BARQ SECURE ORDER CREATION
// Verifies prices, discounts and stock.
// Creates order and delivery code atomically.
// ==========================================

exports.createOrder = onCall(async request => {
  const uid = await requireUser(request);

  const data = request.data || {};
  const items = data.items;
  const customer = data.customer;

  // Validate cart.
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Your cart is empty or contains too many items."
    );
  }

  if (!customer || typeof customer !== "object") {
    throw new HttpsError(
      "invalid-argument",
      "Customer information is missing."
    );
  }

  // Validate customer.
  const fullName = String(customer.fullName || "").trim();
  const phone = String(customer.phone || "").trim();
  const email = String(customer.email || "").trim();
  const address = String(customer.address || "").trim();
  const paymentMethod = String(customer.paymentMethod || "").trim();

  if (fullName.length < 2 || fullName.length > 100) {
    throw new HttpsError(
      "invalid-argument",
      "Please enter your full name."
    );
  }

  if (!/^05\d{8}$/.test(phone)) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid Saudi phone number."
    );
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid email address."
    );
  }

  if (address.length < 5 || address.length > 1000) {
    throw new HttpsError(
      "invalid-argument",
      "Please enter your delivery address."
    );
  }

  if (!paymentMethod || paymentMethod.length > 60) {
    throw new HttpsError(
      "invalid-argument",
      "Please select a payment method."
    );
  }

  // Validate optional GPS information.
  const latitude =
    data.latitude == null ? null : Number(data.latitude);

  const longitude =
    data.longitude == null ? null : Number(data.longitude);

  const locationAccuracy =
    data.locationAccuracy == null
      ? 0
      : Number(data.locationAccuracy);

  if (
    (latitude !== null &&
      (!Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90)) ||
    (longitude !== null &&
      (!Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180)) ||
    !Number.isFinite(locationAccuracy) ||
    locationAccuracy < 0
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid delivery location."
    );
  }

  // Get trusted price from Firestore.
  function getTrustedPrice(product, size) {
    const sizePrices = product.sizePrices || {};

    if (
      size &&
      Object.prototype.hasOwnProperty.call(sizePrices, size)
    ) {
      return Number(sizePrices[size]);
    }

    if (
      size &&
      Object.prototype.hasOwnProperty.call(product, size)
    ) {
      return Number(product[size]);
    }

    const match = String(size || "").match(/\d+/);

    if (match) {
      const key = match[0];

      if (Object.prototype.hasOwnProperty.call(sizePrices, key)) {
        return Number(sizePrices[key]);
      }

      if (Object.prototype.hasOwnProperty.call(product, key)) {
        return Number(product[key]);
      }
    }

    return Number(product.price);
  }

  // Validate cart items and collect quantities.
  const quantities = new Map();

  for (const item of items) {
    if (!item || typeof item !== "object") {
      throw new HttpsError(
        "invalid-argument",
        "Invalid cart item."
      );
    }

    const productId = item.productId;
    const quantity = item.quantity;
    const size = String(item.size || "");
    const color = String(item.color || "");

    if (
      typeof productId !== "string" ||
      !productId.trim() ||
      productId.length > 150
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid product."
      );
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 999
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid product quantity."
      );
    }

    if (size.length > 100 || color.length > 100) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid product option."
      );
    }

    quantities.set(
      productId,
      (quantities.get(productId) || 0) + quantity
    );
  }

  for (const quantity of quantities.values()) {
    if (!Number.isSafeInteger(quantity)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid total quantity."
      );
    }
  }

  // Prepare Firestore references.
  const productRefs = new Map();

  for (const productId of quantities.keys()) {
    productRefs.set(
      productId,
      db.collection("products").doc(productId)
    );
  }

  const orderRef = db.collection("orders").doc();

  const deliveryCodeRef = db
    .collection("deliveryCodes")
    .doc(orderRef.id);

  // Generate six-digit delivery code.
  const deliveryCode = String(
    require("crypto").randomInt(0, 1000000)
  ).padStart(6, "0");

  let finalOrderData;
  let finalTotals;

  // Create order transaction.
  await db.runTransaction(async transaction => {
    const products = new Map();

    // Read every product before writing.
    for (const [productId, productRef] of productRefs) {
      const snapshot = await transaction.get(productRef);

      if (!snapshot.exists) {
        throw new HttpsError(
          "not-found",
          "A product in your cart is no longer available."
        );
      }

      const product = snapshot.data();

      if (product.active === false) {
        throw new HttpsError(
          "failed-precondition",
          `${product.name || "A product"} is no longer available.`
        );
      }

      products.set(productId, {
        ref: productRef,
        data: product
      });
    }

    // Calculate trusted prices and discounts.
    let subtotalHalalas = 0;
    const trustedItems = [];

    for (const item of items) {
      const product = products.get(item.productId).data;

      const size = String(item.size || "");
      const color = String(item.color || "");

      if (
        Array.isArray(product.sizes) &&
        product.sizes.length > 0 &&
        !product.sizes.includes(size)
      ) {
        throw new HttpsError(
          "failed-precondition",
          `${product.name || "A product"} has an invalid size.`
        );
      }

      if (
        Array.isArray(product.colors) &&
        product.colors.length > 0 &&
        !product.colors.includes(color)
      ) {
        throw new HttpsError(
          "failed-precondition",
          `${product.name || "A product"} has an invalid color.`
        );
      }

      const originalPrice = getTrustedPrice(product, size);

      if (
        !Number.isFinite(originalPrice) ||
        originalPrice < 0
      ) {
        throw new HttpsError(
          "failed-precondition",
          `${product.name || "A product"} has an invalid price.`
        );
      }

      const originalHalalas = Math.round(originalPrice * 100);

      if (!Number.isSafeInteger(originalHalalas)) {
        throw new HttpsError(
          "failed-precondition",
          "A product price is invalid."
        );
      }

      // Apply server-verified offer.
      let discountPercent = 0;

      if (product.offerActive === true) {
        const percentage = Number(product.discountPercent);

        if (
          !Number.isInteger(percentage) ||
          percentage < 1 ||
          percentage > 99
        ) {
          throw new HttpsError(
            "failed-precondition",
            `${product.name || "A product"} has an invalid offer.`
          );
        }

        discountPercent = percentage;
      }

      const discountHalalas = Math.round(
        originalHalalas * discountPercent / 100
      );

      const finalPriceHalalas =
        originalHalalas - discountHalalas;

      subtotalHalalas +=
        finalPriceHalalas * item.quantity;

      if (!Number.isSafeInteger(subtotalHalalas)) {
        throw new HttpsError(
          "invalid-argument",
          "Order total is too large."
        );
      }

      trustedItems.push({
        productId: item.productId,
        name: String(product.name || "Product"),
        brand: String(product.brand || "BARQ"),
        originalPrice: originalHalalas / 100,
        discountPercent,
        price: finalPriceHalalas / 100,
        quantity: item.quantity,
        color,
        size
      });
    }

    // Verify available stock.
    for (const [productId, quantity] of quantities) {
      const product = products.get(productId).data;

      if (
        product.stock === undefined ||
        product.stock === null ||
        product.stock === ""
      ) {
        continue;
      }

      const stock = Number(product.stock);

      if (!Number.isSafeInteger(stock) || stock < 0) {
        throw new HttpsError(
          "failed-precondition",
          `${product.name || "A product"} has invalid inventory data.`
        );
      }

      if (stock < quantity) {
        throw new HttpsError(
          "failed-precondition",
          `Only ${stock} unit(s) of ${product.name || "this product"} are available.`
        );
      }
    }

    // Calculate totals.
    const deliveryHalalas = subtotalHalalas > 0 ? 1500 : 0;

    finalTotals = {
      subtotal: subtotalHalalas / 100,
      delivery: deliveryHalalas / 100,
      total: (subtotalHalalas + deliveryHalalas) / 100
    };

    // Prepare final order.
    finalOrderData = {
      customerUid: uid,

      orderNumber:
        "BARQ" + Date.now().toString().slice(-8),

      customerName: fullName,
      phone,
      email,
      address,

      latitude,
      longitude,
      locationAccuracy,

      paymentMethod,

      productIds: [...quantities.keys()],

      items: trustedItems,

      subtotal: finalTotals.subtotal,
      delivery: finalTotals.delivery,
      total: finalTotals.total,

      status: "Pending",
      date: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp()
    };

    // Deduct tracked stock.
    for (const [productId, quantity] of quantities) {
      const product = products.get(productId).data;

      if (
        product.stock === undefined ||
        product.stock === null ||
        product.stock === ""
      ) {
        continue;
      }

      transaction.update(productRefs.get(productId), {
        stock: Number(product.stock) - quantity
      });
    }

    // Save order and delivery code.
    transaction.set(orderRef, finalOrderData);

    transaction.set(deliveryCodeRef, {
      orderId: orderRef.id,
      customerUid: uid,
      code: deliveryCode,
      createdAt: FieldValue.serverTimestamp()
    });
  });

  // Return confirmed order.
  return {
    success: true,
    orderId: orderRef.id,

    order: {
      ...finalOrderData,
      createdAt: new Date().toISOString()
    },

    totals: finalTotals,
    deliveryCode
  };
});
