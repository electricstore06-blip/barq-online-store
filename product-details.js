import { db } from "./firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("PRODUCT DETAILS JS STARTED");

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const container = document.getElementById("productDetails");

async function loadProduct() {
  if (!productId) {
    container.innerHTML = "<h2>No product id</h2>";
    return;
  }

  try {
    const ref = doc(db, "products", productId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      container.innerHTML = "<h2>Product not found</h2>";
      return;
    }

    const product = snap.data();

    const colors = Array.isArray(product.colors)
      ? product.colors
      : [];

    const sizes = Array.isArray(product.sizes)
      ? product.sizes
      : [];

    // Each size can have its own price.
    // If no size-specific price exists, use the normal product price.
    const sizePrices = product.sizePrices || {};

    let selectedColor = "";
    let selectedSize = "";

    function getCurrentPrice() {
      if (selectedSize && sizePrices[selectedSize] !== undefined) {
        return Number(sizePrices[selectedSize]);
      }

      return Number(product.price) || 0;
    }

    container.innerHTML = `
      <div class="product-details-page">

        <div class="product-image-box">
          <img
            src="${product.image || ""}"
            alt="${product.name || "Product"}"
          >
        </div>

        <div class="product-info">

          <h1>${product.name || "Product"}</h1>

          <h3>${product.brand || "BARQ"}</h3>

          <div class="price-box" id="productPrice">
            ${Number(product.price) || 0} SAR
          </div>

          <p>${product.description || ""}</p>

          ${
            colors.length
              ? `
                <h3>Choose Color *</h3>
                <div class="option-buttons" id="colorOptions">
                  ${colors.map(color => `
                    <button
                      type="button"
                      class="product-option"
                      data-color="${color}"
                    >${color}</button>
                  `).join("")}
                </div>
              `
              : ""
          }

          ${
            sizes.length
              ? `
                <h3>Choose Size *</h3>
                <div class="option-buttons" id="sizeOptions">
                  ${sizes.map(size => `
                    <button
                      type="button"
                      class="product-option"
                      data-size="${size}"
                    >${size}</button>
                  `).join("")}
                </div>
              `
              : ""
          }

          <p id="optionMessage" role="status"></p>

          <button
            type="button"
            class="add-cart-btn"
            id="addProductToCart"
          >
            Add To Cart
          </button>

        </div>
      </div>
    `;

    // Style selected options.
    const style = document.createElement("style");

    style.textContent = `
      .product-option.selected {
        background: #d4145a;
        color: white;
        border-color: #d4145a;
      }

      .product-option:focus-visible {
        outline: 2px solid #d4145a;
        outline-offset: 3px;
      }

      #optionMessage {
        color: #d4145a;
        margin-top: 12px;
      }
    `;

    document.head.appendChild(style);

    const priceElement = document.getElementById("productPrice");
    const messageElement = document.getElementById("optionMessage");

    function updatePrice() {
      priceElement.textContent = `${getCurrentPrice()} SAR`;
    }

    function selectOption(button, groupSelector, value, type) {
      document.querySelectorAll(
        `${groupSelector} .product-option`
      ).forEach(option => {
        option.classList.remove("selected");
        option.setAttribute("aria-pressed", "false");
      });

      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");

      if (type === "color") {
        selectedColor = value;
      } else {
        selectedSize = value;
      }

      messageElement.textContent = "";
      updatePrice();
    }

    document.querySelectorAll("[data-color]").forEach(button => {
      button.setAttribute("aria-pressed", "false");

      button.addEventListener("click", () => {
        selectOption(
          button,
          "#colorOptions",
          button.dataset.color,
          "color"
        );
      });
    });

    document.querySelectorAll("[data-size]").forEach(button => {
      button.setAttribute("aria-pressed", "false");

      button.addEventListener("click", () => {
        selectOption(
          button,
          "#sizeOptions",
          button.dataset.size,
          "size"
        );
      });
    });

    document.getElementById("addProductToCart").addEventListener(
      "click",
      () => {
        if (colors.length && !selectedColor) {
          messageElement.textContent =
            "Please choose a color before adding to cart.";
          return;
        }

        if (sizes.length && !selectedSize) {
          messageElement.textContent =
            "Please choose a size before adding to cart.";
          return;
        }

        const price = getCurrentPrice();

        if (!Number.isFinite(price) || price < 0) {
          messageElement.textContent =
            "This product has an invalid price.";
          return;
        }

        if (typeof window.addToCart !== "function") {
          messageElement.textContent =
            "Cart is not ready. Please refresh the page and try again.";
          console.error("addToCart function not found.");
          return;
        }

        // Pass the selected options along with the product details.
        window.addToCart(
          snap.id,
          product.name || "Product",
          price,
          product.image || "",
          product.brand || "",
          selectedColor,
          selectedSize
        );
      }
    );

  } catch (error) {
    console.error("PRODUCT DETAILS ERROR:", error);
    container.innerHTML = "<h2>Error loading product</h2>";
  }
}

loadProduct();
