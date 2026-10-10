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

    if (!value.trim()) {
        return {
            valid: true,
            prices: sizePrices
        };
    }

    const entries = value.split(",");

    for (const entry of entries) {
        const parts = entry.split(":");

        if (parts.length !== 2) {
            return {
                valid: false,
                error: `Invalid size price "${entry}". Use the format 30ml:79.`
            };
        }

        const size = parts[0].trim();
        const priceText = parts[1].trim();
        const price = Number(priceText);

        if (!size || priceText === "" ||
            !Number.isFinite(price) || price < 0) {
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

        showMessage(
            "Admin access verified. You can manage products."
        );

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
