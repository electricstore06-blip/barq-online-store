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

const additionalImagesContainer = document.getElementById(
    "additional-images-container"
);
const addProductImageButton = document.getElementById(
    "add-product-image-btn"
);

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
    if (message) {
        message.textContent = text;
    }
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
// Example: 30ml:79, 50ml:129
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
        const priceText = parts[1].trim();
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
// MAIN IMAGE PREVIEW
// ==========================================

if (imageInput && imagePreview) {
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
}

// ==========================================
// ADDITIONAL PRODUCT IMAGES
// ==========================================

function addAdditionalImageField(value = "") {
    if (!additionalImagesContainer) return;

    const wrapper = document.createElement("div");
    wrapper.className = "additional-image-field";

    const input = document.createElement("input");
    input.type = "url";
    input.className = "additional-product-image";
    input.placeholder = "https://example.com/another-angle.jpg";
    input.value = value;
    input.setAttribute("aria-label", "Additional product image URL");

    const preview = document.createElement("img");
    preview.alt = "Additional product image preview";
    preview.hidden = true;
    preview.style.cssText =
        "max-width:140px;max-height:140px;object-fit:contain;margin-top:8px;";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove image";

    function updatePreview() {
        const url = getSecureImageUrl(input.value);

        if (!url) {
            preview.hidden = true;
            preview.removeAttribute("src");
            return;
        }

        preview.onload = () => {
            preview.hidden = false;
        };

        preview.onerror = () => {
            preview.hidden = true;
        };

        preview.src = url;
    }

    input.addEventListener("input", updatePreview);

    removeButton.addEventListener("click", () => {
        wrapper.remove();
    });

    wrapper.append(input, removeButton, preview);
    additionalImagesContainer.appendChild(wrapper);

    if (value) updatePreview();
}

if (addProductImageButton) {
    addProductImageButton.addEventListener("click", () => {
        addAdditionalImageField();
    });
}

function resetAdditionalImages() {
    if (additionalImagesContainer) {
        additionalImagesContainer.replaceChildren();
    }
}

function getAdditionalImageUrls() {
    const urls = [];

    if (!additionalImagesContainer) {
        return { valid: true, images: [] };
    }

    const inputs = additionalImagesContainer.querySelectorAll(
        ".additional-product-image"
    );

    for (const input of inputs) {
        const value = input.value.trim();

        if (!value) continue;

        const url = getSecureImageUrl(value);

        if (!url) {
            return {
                valid: false,
                error: "Every additional image must use a valid HTTPS URL."
            };
        }

        urls.push(url);
    }

    const mainImage = getSecureImageUrl(imageInput.value);

    return {
        valid: true,
        images: [...new Set(urls)].filter(url => url !== mainImage)
    };
}

// ==========================================
// RESET FORM
// ==========================================

function resetForm() {
    form.reset();
    resetAdditionalImages();

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

    const stockQuantity =
        Number.isSafeInteger(product.stock) && product.stock >= 0
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

        sizeInformation.textContent =
            "Size prices: " + details.join(" | ");
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

    resetAdditionalImages();

    const existingImages = Array.isArray(product.images)
        ? product.images
        : [];

    existingImages.forEach(url => addAdditionalImageField(url));

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

if (form) {
    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentAdmin) {
            showMessage("Admin access is required to save products.");
            return;
        }

        const name = nameInput.value.trim();
        const brand = brandInput.value.trim();
        const priceText = priceInput.value.trim();
        const stockText = stockInput.value.trim();
        const category = categoryInput.value.trim();
        const description = descriptionInput.value.trim();
        const mainImage = getSecureImageUrl(imageInput.value);

        if (!name) {
            showMessage("Please enter the product name.");
            nameInput.focus();
            return;
        }

        if (
            priceText === "" ||
            !Number.isFinite(Number(priceText)) ||
            Number(priceText) < 0
        ) {
            showMessage("Please enter a valid product price.");
            priceInput.focus();
            return;
        }

        if (
            stockText === "" ||
            !Number.isSafeInteger(Number(stockText)) ||
            Number(stockText) < 0
        ) {
            showMessage("Stock must be a whole number of 0 or more.");
            stockInput.focus();
            return;
        }

        if (!category) {
            showMessage("Please select or enter a product category.");
            categoryInput.focus();
            return;
        }

        if (!mainImage) {
            showMessage("Please enter a valid HTTPS URL for the main image.");
            imageInput.focus();
            return;
        }

        const sizes = splitOptions(sizesInput.value);
        const colors = splitOptions(colorsInput.value);

        const parsedPrices = parseSizePrices(
            sizePricesInput.value,
            sizes
        );

        if (!parsedPrices.valid) {
            showMessage(parsedPrices.error);
            sizePricesInput.focus();
            return;
        }

        const additionalImages = getAdditionalImageUrls();

        if (!additionalImages.valid) {
            showMessage(additionalImages.error);
            return;
        }

        const productData = {
            name,
            brand,
            price: Number(priceText),
            stock: Number(stockText),
            category,
            image: mainImage,
            images: additionalImages.images,
            description,
            colors,
            sizes,
            sizePrices: parsedPrices.prices,
            active: activeInput.checked,
            updatedAt: serverTimestamp(),
            updatedBy: currentAdmin.uid
        };

        const existingId = productIdInput.value.trim();

        saveButton.disabled = true;
        saveButton.textContent = existingId
            ? "Updating..."
            : "Saving...";

        try {
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
                "Could not save the product. Check Firebase permissions and try again."
            );
        } finally {
            saveButton.disabled = false;

            saveButton.textContent = productIdInput.value
                ? "Update Product"
                : "Save Product";
        }
    });
}

// ==========================================
// CANCEL PRODUCT EDITING
// ==========================================

if (cancelButton) {
    cancelButton.addEventListener("click", () => {
        resetForm();
        showMessage("Product editing cancelled.");
    });
}

// ==========================================
// ADMIN LOGOUT
// ==========================================

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;

        try {
            await signOut(auth);
            window.location.href = "index.html";
        } catch (error) {
            console.error("ADMIN LOGOUT ERROR:", error);

            showMessage("Could not log out. Please try again.");

            logoutButton.disabled = false;
        }
    });
}
// ==========================================
// CUSTOMER REVIEW MESSAGES
// ==========================================

function setReviewsMessage(text, isError = false) {
    if (!reviewsMessage) return;

    reviewsMessage.textContent = text;
    reviewsMessage.style.color = isError ? "#dc2626" : "#15803d";
}

// ==========================================
// FORMAT REVIEW DATE
// ==========================================

function formatReviewDate(timestamp) {
    if (!timestamp) return "Date unavailable";

    try {
        const date =
            typeof timestamp.toDate === "function"
                ? timestamp.toDate()
                : new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleString();
    } catch {
        return "Date unavailable";
    }
}

// ==========================================
// LOAD CUSTOMER REVIEWS
// ==========================================

async function loadCustomerReviews() {
    if (!currentAdmin) {
        setReviewsMessage("Admin access is required.", true);
        return;
    }

    if (!reviewsContainer) {
        console.error(
            "Customer reviews container not found. Check admin-products.html for #customer-reviews-container."
        );
        return;
    }

    reviewsContainer.replaceChildren();
    setReviewsMessage("Loading customer reviews...");

    try {
        const [reviewsSnapshot, productsSnapshot] = await Promise.all([
            getDocs(collection(db, "productReviews")),
            getDocs(collection(db, "products"))
        ]);

        const productNames = new Map();

        productsSnapshot.forEach(productDoc => {
            const product = productDoc.data();

            productNames.set(
                productDoc.id,
                product.name || "Unknown product"
            );
        });

        const selectedStatus = reviewStatusFilter
            ? reviewStatusFilter.value
            : "all";

        const reviews = [];

        reviewsSnapshot.forEach(reviewDoc => {
            const review = reviewDoc.data();

            const status = review.status || "pending";

            if (
                selectedStatus !== "all" &&
                status !== selectedStatus
            ) {
                return;
            }

            reviews.push({
                id: reviewDoc.id,
                ...review,
                status
            });
        });

        reviews.sort((a, b) => {
            const dateA = a.createdAt?.toMillis
                ? a.createdAt.toMillis()
                : 0;

            const dateB = b.createdAt?.toMillis
                ? b.createdAt.toMillis()
                : 0;

            return dateB - dateA;
        });

        reviewsContainer.replaceChildren();

        if (reviews.length === 0) {
            const empty = document.createElement("p");

            empty.textContent =
                selectedStatus === "all"
                    ? "No customer reviews found."
                    : `No ${selectedStatus} reviews found.`;

            reviewsContainer.appendChild(empty);

            setReviewsMessage("Reviews loaded successfully.");
            return;
        }

        reviews.forEach(review => {
            const card = document.createElement("article");
            card.className = "customer-review-card";

            const productName = document.createElement("h3");

            productName.textContent =
                productNames.get(review.productId) ||
                review.productName ||
                "Unknown product";

            const statusText = document.createElement("p");
            statusText.textContent =
                "Status: " + review.status.toUpperCase();

            const customerText = document.createElement("p");
            customerText.textContent =
                "Customer UID: " + (review.userId || "Not provided");

            const ratingText = document.createElement("p");

            const rating = Number(review.rating);

            ratingText.textContent =
                "Rating: " +
                (
                    Number.isInteger(rating) &&
                    rating >= 1 &&
                    rating <= 5
                        ? "★".repeat(rating) + "☆".repeat(5 - rating)
                        : "Not provided"
                );

            const commentText = document.createElement("p");
            commentText.textContent =
                "Review: " + (review.comment || "No comment");

            const dateText = document.createElement("p");
            dateText.textContent =
                "Submitted: " + formatReviewDate(review.createdAt);

            const orderText = document.createElement("p");
            orderText.textContent =
                "Order ID: " + (review.orderId || "Not provided");

            const verifiedText = document.createElement("p");
            verifiedText.textContent =
                "Verified purchase: " +
                (review.verifiedPurchase === true ? "Yes" : "No");

            const actions = document.createElement("div");
            actions.className = "review-actions";

            if (review.status !== "approved") {
                const approveButton = document.createElement("button");

                approveButton.type = "button";
                approveButton.textContent = "Approve";

                approveButton.addEventListener("click", async () => {
                    approveButton.disabled = true;
                    setReviewsMessage("Approving review...");

                    try {
                        await updateDoc(
                            doc(db, "productReviews", review.id),
                            {
                                status: "approved",
                                approvedAt: serverTimestamp(),
                                approvedBy: currentAdmin.uid
                            }
                        );

                        setReviewsMessage("Review approved successfully.");

                        await loadCustomerReviews();
                    } catch (error) {
                        console.error("APPROVE REVIEW ERROR:", error);

                        setReviewsMessage(
                            "Could not approve review. Check Firestore permissions.",
                            true
                        );

                        approveButton.disabled = false;
                    }
                });

                actions.appendChild(approveButton);
            }

            if (review.status !== "rejected") {
                const rejectButton = document.createElement("button");

                rejectButton.type = "button";
                rejectButton.textContent = "Reject";

                rejectButton.addEventListener("click", async () => {
                    const confirmed = window.confirm(
                        "Are you sure you want to reject this review?"
                    );

                    if (!confirmed) return;

                    rejectButton.disabled = true;
                    setReviewsMessage("Rejecting review...");

                    try {
                        await updateDoc(
                            doc(db, "productReviews", review.id),
                            {
                                status: "rejected",
                                rejectedAt: serverTimestamp(),
                                rejectedBy: currentAdmin.uid
                            }
                        );

                        setReviewsMessage("Review rejected successfully.");

                        await loadCustomerReviews();
                    } catch (error) {
                        console.error("REJECT REVIEW ERROR:", error);

                        setReviewsMessage(
                            "Could not reject review. Check Firestore permissions.",
                            true
                        );

                        rejectButton.disabled = false;
                    }
                });

                actions.appendChild(rejectButton);
            }

            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-btn";

            deleteButton.addEventListener("click", async () => {
                const confirmed = window.confirm(
                    "Permanently delete this customer review?"
                );

                if (!confirmed) return;

                deleteButton.disabled = true;
                setReviewsMessage("Deleting review...");

                try {
                    await deleteDoc(
                        doc(db, "productReviews", review.id)
                    );

                    setReviewsMessage("Review deleted successfully.");

                    await loadCustomerReviews();
                } catch (error) {
                    console.error("DELETE REVIEW ERROR:", error);

                    setReviewsMessage(
                        "Could not delete review. Check Firestore permissions.",
                        true
                    );

                    deleteButton.disabled = false;
                }
            });

            actions.appendChild(deleteButton);

            card.append(
                productName,
                statusText,
                customerText,
                ratingText,
                commentText,
                dateText,
                orderText,
                verifiedText,
                actions
            );

            reviewsContainer.appendChild(card);
        });

        setReviewsMessage(
            `${reviews.length} review(s) loaded successfully.`
        );
    } catch (error) {
        console.error("LOAD CUSTOMER REVIEWS ERROR:", error);

        reviewsContainer.replaceChildren();

        setReviewsMessage(
            "Could not load customer reviews. Check Firestore security rules and collection names.",
            true
        );
    }
}

// ==========================================
// REVIEW FILTER
// ==========================================

if (reviewStatusFilter) {
    reviewStatusFilter.addEventListener("change", () => {
        loadCustomerReviews();
    });
}

// ==========================================
// REFRESH REVIEWS
// ==========================================

if (refreshReviewsButton) {
    refreshReviewsButton.addEventListener("click", () => {
        loadCustomerReviews();
    });
}

// ==========================================
// CHECK ADMIN ACCESS
// ==========================================

onAuthStateChanged(auth, async user => {
    if (formSection) formSection.hidden = true;
    if (listSection) listSection.hidden = true;
    if (reviewsSection) reviewsSection.hidden = true;

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

        if (formSection) formSection.hidden = false;
        if (listSection) listSection.hidden = false;
        if (reviewsSection) reviewsSection.hidden = false;

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
