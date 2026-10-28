import { db, auth } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ==========================================
// BARQ ADMIN PRODUCT MANAGEMENT
// ==========================================

const message = document.getElementById("admin-message");
const formSection = document.getElementById("product-form-section");
const listSection = document.getElementById("product-list-section");
const form = document.getElementById("product-form");
const container = document.getElementById("products-container");

const reviewsSection = document.getElementById(
    "customer-reviews-section"
);
const reviewsContainer = document.getElementById(
    "customer-reviews-container"
);
const reviewsMessage = document.getElementById("reviews-message");
const reviewStatusFilter = document.getElementById(
    "review-status-filter"
);
const refreshReviewsButton = document.getElementById(
    "refresh-reviews-btn"
);

const productIdInput = document.getElementById("product-id");
const nameInput = document.getElementById("product-name");
const brandInput = document.getElementById("product-brand");
const priceInput = document.getElementById("product-price");
const categoryInput = document.getElementById("product-category");
const imageInput = document.getElementById("product-image");
const descriptionInput = document.getElementById("product-description");
const colorsInput = document.getElementById("product-colors");
const sizesInput = document.getElementById("product-sizes");
const sizePricesInput = document.getElementById("product-size-prices");
const stockInput = document.getElementById("product-stock");
const activeInput = document.getElementById("product-active");
const imagePreview = document.getElementById("image-preview");

const formTitle = document.getElementById("form-title");
const saveButton = document.getElementById("save-product-btn");
const cancelButton = document.getElementById("cancel-edit-btn");
const logoutButton = document.getElementById("logout-btn");

let currentAdmin = null;
let productsLoaded = false;

// ==========================================
// MESSAGES
// ==========================================

function showMessage(text) {
    message.textContent = text;
}

// ==========================================
// IMAGE URL VALIDATION
// ==========================================

function getSecureImageUrl(value) {
    try {
        const url = new URL(value.trim());

        if (url.protocol !== "https:") {
            return null;
        }

        return url.href;
    } catch {
        return null;
    }
}

// ==========================================
// CONVERT COMMA-SEPARATED OPTIONS INTO ARRAYS
// ==========================================

function splitOptions(value) {
    return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

// ==========================================
// PARSE SIZE PRICES
//
// Example input:
// 30ml:79, 50ml:129, 100ml:199
//
// Result:
// {
//     "30ml": 79,
//     "50ml": 129,
//     "100ml": 199
// }
// ==========================================

function parseSizePrices(value, sizes) {
    const sizePrices = {};
    const entries = value
        .split(",")
        .map(entry => entry.trim())
        .filter(Boolean);

    for (const entry of entries) {
        const parts = entry.split(":");

        if (parts.length !== 2) {
            return {
                valid: false,
                error: `Invalid size price "${entry}". Use the format Size:Price.`
            };
        }

           const size = parts[0].trim();
        const priceText = priceInput.value.trim();
        const price = Number(priceText);

        if (
            !size ||
            priceText === "" ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            return {
                valid: false,
                error: `Invalid price for "${size || entry}". Enter a valid price of 0 or more.`
            };
        }

        if (!sizes.includes(size)) {
            return {
                valid: false,
                error: `The size "${size}" is missing from the Sizes field.`
            };
        }

        if (Object.prototype.hasOwnProperty.call(sizePrices, size)) {
            return {
                valid: false,
                error: `The size "${size}" has been entered more than once.`
            };
        }

        sizePrices[size] = price;
    }

    return {
        valid: true,
        prices: sizePrices
    };
}

// ==========================================
// FORMAT SIZE PRICES FOR EDITING
// ==========================================

function formatSizePrices(sizePrices) {
    if (!sizePrices || typeof sizePrices !== "object") {
        return "";
    }

    return Object.entries(sizePrices)
        .map(([size, price]) => `${size}:${price}`)
        .join(", ");
}

// ==========================================
// IMAGE PREVIEW
// ==========================================

imageInput.addEventListener("input", () => {
    const url = getSecureImageUrl(imageInput.value);

    if (!url) {
        imagePreview.hidden = true;
        imagePreview.removeAttribute("src");
        return;
    }

    imagePreview.onload = () => {
        imagePreview.hidden = false;
    };

    imagePreview.onerror = () => {
        imagePreview.hidden = true;
    };

    imagePreview.src = url;
});

// ==========================================
// RESET FORM
// ==========================================

function resetForm() {
    form.reset();

    productIdInput.value = "";
    activeInput.checked = true;

    imagePreview.hidden = true;
    imagePreview.removeAttribute("src");

    formTitle.textContent = "Add New Product";
    saveButton.textContent = "Save Product";
    cancelButton.hidden = true;
}

// ==========================================
// CREATE PRODUCT CARD
// ==========================================

function createProductCard(id, product) {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("img");
    image.alt = product.name || "Product image";

    const imageUrl = getSecureImageUrl(product.image || "");

    if (imageUrl) {
        image.src = imageUrl;

        image.onerror = () => {
            image.hidden = true;
        };
    } else {
        image.hidden = true;
    }

    const name = document.createElement("h4");
    name.textContent = product.name || "Unnamed product";

    const brand = document.createElement("p");
    brand.textContent = "Brand: " + (product.brand || "BARQ");

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = `${Number(product.price || 0).toFixed(2)} SAR`;

    const category = document.createElement("p");
    category.textContent =
        "Category: " + (product.category || "Uncategorized");

    const status = document.createElement("p");
    status.textContent =
        product.active === false ? "Hidden from store" : "Active";
    const stockInformation = document.createElement("p");
const stockQuantity = Number.isSafeInteger(product.stock) && product.stock >= 0
    ? product.stock
    : 0;

stockInformation.textContent = `Stock: ${stockQuantity} units`;

if (stockQuantity === 0) {
    stockInformation.textContent += " — Out of stock";
}

    const sizeInformation = document.createElement("p");

    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const sizePrices = product.sizePrices || {};

    if (sizes.length > 0) {
        const details = sizes.map(size => {
            if (
                Object.prototype.hasOwnProperty.call(sizePrices, size)
            ) {
                return `${size}: ${Number(sizePrices[size]).toFixed(2)} SAR`;
            }

            return `${size}: Base price`;
        });

        sizeInformation.textContent = "Size prices: " + details.join(" | ");
    } else {
        sizeInformation.textContent = "No sizes configured.";
    }

    const actions = document.createElement("div");
    actions.className = "product-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {
        editProduct(id, product);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";

    deleteButton.addEventListener("click", async () => {
        const confirmed = window.confirm(
            `Delete "${product.name || "this product"}"? This cannot be undone.`
        );

        if (!confirmed) return;

        deleteButton.disabled = true;

        try {
            await deleteDoc(doc(db, "products", id));

            showMessage("Product deleted successfully.");

            await loadProducts();
        } catch (error) {
            console.error("DELETE PRODUCT ERROR:", error);

            showMessage(
                "Could not delete product. Check Firebase permissions."
            );

            deleteButton.disabled = false;
        }
    });

    actions.append(editButton, deleteButton);

  card.append(
    image,
    name,
    brand,
    price,
    category,
    status,
    stockInformation,
    sizeInformation,
    actions
);

    return card;
}

// ==========================================
// LOAD PRODUCTS FROM FIREBASE
// ==========================================

async function loadProducts() {
    container.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "Loading products...";

    container.appendChild(loading);

    try {
        const snapshot = await getDocs(collection(db, "products"));

        container.replaceChildren();

        if (snapshot.empty) {
            const empty = document.createElement("p");

            empty.textContent =
                "No products yet. Add your first product above.";

            container.appendChild(empty);
            return;
        }

        snapshot.forEach(productDoc => {
            container.appendChild(
                createProductCard(
                    productDoc.id,
                    productDoc.data()
                )
            );
        });
    } catch (error) {
        console.error("LOAD PRODUCTS ERROR:", error);

        container.replaceChildren();

        const errorText = document.createElement("p");

        errorText.textContent =
            "Could not load products. Check your Firestore security rules.";

        container.appendChild(errorText);
    }
}

// ==========================================
// EDIT EXISTING PRODUCT
// ==========================================

function editProduct(id, product) {
    productIdInput.value = id;

    nameInput.value = product.name || "";
    brandInput.value = product.brand || "";
    priceInput.value = product.price ?? "";
    stockInput.value = product.stock ?? 0;
    categoryInput.value = product.category || "";
    imageInput.value = product.image || "";
    descriptionInput.value = product.description || "";

    colorsInput.value = (
        Array.isArray(product.colors) ? product.colors : []
    ).join(", ");

    sizesInput.value = (
        Array.isArray(product.sizes) ? product.sizes : []
    ).join(", ");

    sizePricesInput.value = formatSizePrices(product.sizePrices);

    activeInput.checked = product.active !== false;

    const url = getSecureImageUrl(product.image || "");

    if (url) {
        imagePreview.onload = () => {
            imagePreview.hidden = false;
        };

        imagePreview.onerror = () => {
            imagePreview.hidden = true;
        };

        imagePreview.src = url;
    } else {
        imagePreview.hidden = true;
        imagePreview.removeAttribute("src");
    }

    formTitle.textContent = "Edit Product";
    saveButton.textContent = "Update Product";
    cancelButton.hidden = false;

    formSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


 // ==========================================
 // SAVE OR UPDATE PRODUCT
 // ==========================================

form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentAdmin) {
        showMessage("Admin access has not been verified.");
        return;
    }

    const name = nameInput.value.trim();
    const brand = brandInput.value.trim();
    const category = categoryInput.value.trim();
    const description = descriptionInput.value.trim();
    const image = getSecureImageUrl(imageInput.value);

    const priceText = priceInput.value.trim();
    const price = Number(priceText);

    // Validate stock quantity
    const stockText = stockInput.value.trim();
    const stock = Number(stockText);

    if (
        stockText === "" ||
        !Number.isSafeInteger(stock) ||
        stock < 0
    ) {
        showMessage("Please enter a whole stock quantity of 0 or more.");
        return;
    }

    const colors = splitOptions(colorsInput.value);
    const sizes = splitOptions(sizesInput.value);

    if (!name) {
        showMessage("Please enter the product name.");
        return;
    }

    if (
        priceText === "" ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        showMessage("Please enter a valid base price.");
        return;
    }

    if (!image) {
        showMessage("Please enter a valid HTTPS image URL.");
        return;
    }

    const parsedPrices = parseSizePrices(
        sizePricesInput.value,
        sizes
    );

    if (!parsedPrices.valid) {
        showMessage(parsedPrices.error);
        return;
    }

    const productData = {
        name,
        brand,
        price,
        stock,
        category,
        image,
        description,
        colors,
        sizes,
        sizePrices: parsedPrices.prices,
        active: activeInput.checked,
        updatedAt: serverTimestamp(),
        updatedBy: currentAdmin.uid
    };

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    showMessage("Saving product...");

    try {
        const existingId = productIdInput.value;

        if (existingId) {
            await updateDoc(
                doc(db, "products", existingId),
                productData
            );

            showMessage("Product updated successfully.");
        } else {
            await addDoc(
                collection(db, "products"),
                {
                    ...productData,
                    createdAt: serverTimestamp(),
                    createdBy: currentAdmin.uid
                }
            );

            showMessage("Product added successfully.");
        }

        resetForm();

        await loadProducts();
    } catch (error) {
        console.error("SAVE PRODUCT ERROR:", error);

        showMessage(
            "Could not save product. Check Firestore security rules and your connection."
        );
    } finally {
        saveButton.disabled = false;

        saveButton.textContent = productIdInput.value
            ? "Update Product"
            : "Save Product";
    }
});

// ==========================================
// CANCEL EDITING
// ==========================================

cancelButton.addEventListener("click", () => {
    resetForm();
    showMessage("Editing cancelled.");
});

// ==========================================
// LOG OUT
// ==========================================

logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
        await signOut(auth);

        window.location.href = "index.html";
    } catch (error) {
        console.error("LOGOUT ERROR:", error);

        showMessage("Could not log out. Please try again.");

        logoutButton.disabled = false;
    }
});

/* ==========================================
   CUSTOMER REVIEW MANAGEMENT
========================================== */

function setReviewsMessage(text, isError = false) {
    reviewsMessage.textContent = text;
    reviewsMessage.style.color = isError ? "#b00020" : "#176b36";
}

function formatReviewDate(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== "function") {
        return "Date unavailable";
    }

    return timestamp.toDate().toLocaleString();
}

async function loadCustomerReviews() {
    if (!currentAdmin) return;

    reviewsContainer.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "Loading customer reviews...";
    reviewsContainer.appendChild(loading);

    setReviewsMessage("");

    try {
        // Load reviews and products for their display names.
        const [reviewSnapshot, productSnapshot] = await Promise.all([
            getDocs(collection(db, "productReviews")),
            getDocs(collection(db, "products"))
        ]);

        const productNames = new Map();

        productSnapshot.forEach(productDoc => {
            const product = productDoc.data();
            productNames.set(
                productDoc.id,
                product.name || "Unnamed product"
            );
        });

        const selectedStatus = reviewStatusFilter.value;

        const reviews = reviewSnapshot.docs
            .map(reviewDoc => ({
                id: reviewDoc.id,
                ...reviewDoc.data()
            }))
            .filter(review => {
                return selectedStatus === "all" ||
                    review.status === selectedStatus;
            })
            .sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            });

        reviewsContainer.replaceChildren();

        if (!reviews.length) {
            const empty = document.createElement("p");
            empty.textContent = "No reviews found for this filter.";
            reviewsContainer.appendChild(empty);
            setReviewsMessage("Reviews loaded successfully.");
            return;
        }

        reviews.forEach(review => {
            const card = document.createElement("article");

            card.style.cssText = `
                border: 1px solid #ddd;
                border-radius: 10px;
                padding: 16px;
                margin: 12px 0;
                background: #fff;
            `;

            const product = document.createElement("h4");
            product.textContent =
                "Product: " +
                (productNames.get(review.productId) ||
                 "Product not found");

            const customer = document.createElement("p");
            customer.textContent =
                "Customer UID: " + (review.userId || "Unavailable");

            const rating = document.createElement("p");
            const numericRating = Number(review.rating);
            rating.textContent =
                "Rating: " +
                (Number.isInteger(numericRating) &&
                 numericRating >= 1 && numericRating <= 5
                    ? "★".repeat(numericRating) +
                      "☆".repeat(5 - numericRating) +
                      ` (${numericRating}/5)`
                    : "Invalid rating");

            const comment = document.createElement("p");
            comment.textContent = "Review: " + (review.comment || "");

            const date = document.createElement("p");
            date.textContent =
                "Submitted: " + formatReviewDate(review.createdAt);

            const order = document.createElement("p");
            order.textContent =
                "Order ID: " + (review.orderId || "Unavailable");

            const status = document.createElement("p");
            status.textContent =
                "Status: " + (review.status || "Unspecified");

            const verified = document.createElement("p");
            verified.textContent = review.verifiedPurchase
                ? "Verified purchase"
                : "Purchase not verified";

            const actions = document.createElement("div");
            actions.style.cssText =
                "display:flex; gap:8px; flex-wrap:wrap;";

            async function changeReviewStatus(newStatus, button) {
                button.disabled = true;

                try {
                    await updateDoc(
                        doc(db, "productReviews", review.id),
                        {
                            status: newStatus,
                            updatedAt: serverTimestamp()
                        }
                    );

                    setReviewsMessage(
                        `Review ${newStatus} successfully.`
                    );

                    await loadCustomerReviews();
                } catch (error) {
                    console.error("UPDATE REVIEW ERROR:", error);

                    setReviewsMessage(
                        "Could not update review. Check Firestore rules.",
                        true
                    );

                    button.disabled = false;
                }
            }

            if (review.status !== "approved") {
                const approveButton = document.createElement("button");
                approveButton.type = "button";
                approveButton.textContent = "Approve";

                approveButton.addEventListener("click", () => {
                    changeReviewStatus("approved", approveButton);
                });

                actions.appendChild(approveButton);
            }

            if (review.status !== "rejected") {
                const rejectButton = document.createElement("button");
                rejectButton.type = "button";
                rejectButton.textContent = "Reject";

                rejectButton.addEventListener("click", () => {
                    changeReviewStatus("rejected", rejectButton);
                });

                actions.appendChild(rejectButton);
            }

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", async () => {
                if (!window.confirm(
                    "Permanently delete this customer review?"
                )) {
                    return;
                }

                deleteButton.disabled = true;

                try {
                    await deleteDoc(
                        doc(db, "productReviews", review.id)
                    );

                    setReviewsMessage("Review deleted successfully.");
                    await loadCustomerReviews();
                } catch (error) {
                    console.error("DELETE REVIEW ERROR:", error);

                    setReviewsMessage(
                        "Could not delete review. Check Firestore rules.",
                        true
                    );

                    deleteButton.disabled = false;
                }
            });

            actions.appendChild(deleteButton);

            card.append(
                product,
                customer,
                rating,
                comment,
                date,
                order,
                verified,
                status,
                actions
            );

            reviewsContainer.appendChild(card);
        });

        setReviewsMessage(
            `Showing ${reviews.length} review(s).`
        );
    } catch (error) {
        console.error("LOAD CUSTOMER REVIEWS ERROR:", error);

        reviewsContainer.replaceChildren();

        const errorText = document.createElement("p");
        errorText.textContent =
            "Could not load reviews. Check Firestore security rules.";

        reviewsContainer.appendChild(errorText);

        setReviewsMessage(
            "Review loading failed. See the browser console for details.",
            true
        );
    }
}

reviewStatusFilter.addEventListener("change", loadCustomerReviews);

refreshReviewsButton.addEventListener("click", loadCustomerReviews);

// ==========================================
// VERIFY ADMIN ACCESS
// ==========================================

onAuthStateChanged(auth, async user => {
    formSection.hidden = true;
    listSection.hidden = true;

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    showMessage("Checking admin access...");

    try {
        const adminSnapshot = await getDoc(
            doc(db, "admins", user.uid)
        );

        if (
            !adminSnapshot.exists() ||
            adminSnapshot.data().role !== "admin"
        ) {
            showMessage("Access denied. Admin account required.");

            await signOut(auth);

            window.location.href = "index.html";
            return;
        }

        currentAdmin = user;

     
formSection.hidden = false;
listSection.hidden = false;
reviewsSection.hidden = false;

showMessage(
    "Admin access verified. You can manage products and customer reviews."
);

await loadCustomerReviews();
  

        if (!productsLoaded) {
            productsLoaded = true;

            await loadProducts();
        }
    } catch (error) {
        console.error("ADMIN CHECK ERROR:", error);

        showMessage(
            "Could not verify admin access. Check your internet connection and Firestore security rules."
        );
    }
});
