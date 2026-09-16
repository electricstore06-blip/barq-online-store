// ==============================
// BARQ CHECKOUT JAVASCRIPT
// ==============================

document.addEventListener("DOMContentLoaded", function () {

    // ==============================
    // GET CART
    // ==============================

    const cart =
        JSON.parse(localStorage.getItem("barqCart")) || [];


    // ==============================
    // ORDER SUMMARY ELEMENTS
    // ==============================

    const orderItems =
        document.getElementById("order-items");

    const subtotalElement =
        document.getElementById("subtotal");

    const deliveryElement =
        document.getElementById("delivery");

    const totalElement =
        document.getElementById("total");


    // ==============================
    // DISPLAY ORDER SUMMARY
    // ==============================

    function renderOrderSummary() {

        if (
            !orderItems ||
            !subtotalElement ||
            !deliveryElement ||
            !totalElement
        ) {
            return;
        }

        orderItems.innerHTML = "";

        // Empty cart
        if (cart.length === 0) {

            orderItems.innerHTML =
                `<p class="empty-order">
                    Your cart is empty.
                </p>`;

            subtotalElement.textContent = "SAR 0.00";
            deliveryElement.textContent = "SAR 0.00";
            totalElement.textContent = "SAR 0.00";

            return;
        }


        let subtotal = 0;


        // Display each product
        cart.forEach(function (item) {

            const price =
                Number(item.price) || 0;

            const quantity =
                Number(item.quantity) || 0;

            const itemTotal =
                price * quantity;

            subtotal += itemTotal;


            const itemElement =
                document.createElement("div");

            itemElement.className =
                "order-item";


            itemElement.innerHTML = `

                <div class="order-item-info">

                    <strong class="order-item-name">
                    </strong>

                    <span class="order-item-quantity">
                        Qty: ${quantity}
                    </span>

                </div>

                <span class="order-item-price">
                    SAR ${itemTotal.toFixed(2)}
                </span>

            `;


            itemElement.querySelector(
                ".order-item-name"
            ).textContent =
                item.name || "BARQ Product";


            orderItems.appendChild(itemElement);

        });


        // ==============================
        // DELIVERY
        // ==============================

        const delivery =
            subtotal > 0 ? 15 : 0;


        // ==============================
        // TOTAL
        // ==============================

        const total =
            subtotal + delivery;


        subtotalElement.textContent =
            `SAR ${subtotal.toFixed(2)}`;

        deliveryElement.textContent =
            `SAR ${delivery.toFixed(2)}`;

        totalElement.textContent =
            `SAR ${total.toFixed(2)}`;

    }


    // ==============================
    // CUSTOMER INFORMATION
    // ==============================
const orderButton =
    document.getElementById("place-order-btn");


const checkoutMessage =
    document.getElementById("checkout-message");

    const fullName =
        document.getElementById("full-name");

    const phone =
        document.getElementById("phone");

    const email =
        document.getElementById("email");

    const address =
        document.getElementById("address");


    const paymentMethods =
        document.querySelectorAll(
            'input[name="payment"]'
        );


    // ==============================
    // SHOW ORDER
    // ==============================

    renderOrderSummary();


    // ==============================
    // PLACE ORDER
    // ==============================

    if (orderButton) {

        orderButton.addEventListener(
            "click",
            function () {

                // Check cart
                if (cart.length === 0) {

                    alert(
                        "Your cart is empty."
                    );

                    return;
                }


                const name =
                    fullName.value.trim();

                const phoneValue =
                    phone.value.trim();

                const emailValue =
                    email.value.trim();

                const addressValue =
                    address.value.trim();

                const payment =
                    document.querySelector(
                        'input[name="payment"]:checked'
                    );


                // ==============================
                // VALIDATION
                // ==============================

                if (name === "") {

                    alert(
                        "Please enter your full name"
                    );

                    fullName.focus();

                    return;
                }


                if (!/^05\d{8}$/.test(phoneValue)) {

                    alert(
                        "Please enter a valid Saudi phone number.\nExample: 05xxxxxxxx"
                    );

                    phone.focus();

                    return;
                }


                if (
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(emailValue)
                ) {

                    alert(
                        "Please enter a valid email"
                    );

                    email.focus();

                    return;
                }


                if (addressValue === "") {

                    alert(
                        "Please enter delivery address"
                    );

                    address.focus();

                    return;
                }


                if (!payment) {

                    alert(
                        "Please select payment method"
                    );

                    return;
                }


                // ==============================
                // CALCULATE TOTALS
                // ==============================

                const subtotal =
                    cart.reduce(
                        function (sum, item) {

                            const price =
                                Number(item.price) || 0;

                            const quantity =
                                Number(item.quantity) || 0;

                            return sum +
                                (price * quantity);

                        },
                        0
                    );


                const delivery =
                    subtotal > 0 ? 15 : 0;


                const total =
                    subtotal + delivery;


                // ==============================
                // ORDER DATA
                // ==============================

                const orderData = {

                    customerName: name,

                    phone: phoneValue,

                    email: emailValue,

                    address: addressValue,

                    paymentMethod:
                        payment.value,

                    items: cart,

                    subtotal: subtotal,

                    delivery: delivery,

                    total: total,

                    date:
                        new Date().toISOString()

                };


                // Show in browser console
                console.log(orderData);


                // ==============================
                // SUCCESS
                // ==============================

                alert(
                    "Thank you " +
                    name +
                    "!\n\n" +
                    "Your order has been received!" +
                    "\n\nTotal: SAR " +
                    total.toFixed(2)
                );


                // ==============================
                // CLEAR FORM
                // ==============================

                fullName.value = "";

                phone.value = "";

                email.value = "";

                address.value = "";


                paymentMethods.forEach(
                    function (payment) {

                        payment.checked = false;

                    }
                );

            }
        );

    }

});
