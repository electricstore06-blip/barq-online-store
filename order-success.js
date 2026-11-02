
const customerNameElement = document.getElementById("customer-name");
const orderNumberElement = document.getElementById("order-number");
const orderTotalElement = document.getElementById("order-total");
const orderStatusElement = document.getElementById("order-status");
const deliveryCodeElement = document.getElementById("delivery-code");

function showOrderSuccess() {
    try {
        const savedOrder = JSON.parse(
            localStorage.getItem("barqOrder") || "null"
        );

        if (!savedOrder) {
            customerNameElement.textContent = "Thank you for shopping with BARQ!";
            orderNumberElement.textContent = "Order information unavailable";
            orderTotalElement.textContent = "SAR 0.00";
            orderStatusElement.textContent = "Please check My Orders";

            if (deliveryCodeElement) {
                deliveryCodeElement.textContent = "------";
            }

            return;
        }

        const customerName =
            savedOrder.customerName ||
            localStorage.getItem("barqCustomerName") ||
            "Customer";

        const orderNumber =
            savedOrder.orderNumber ||
            savedOrder.id ||
            localStorage.getItem("barqOrderId") ||
            "BARQ0000";

        const total = Number(
            savedOrder.total ??
            localStorage.getItem("barqOrderTotal") ??
            0
        );

        const status = savedOrder.status || "Pending";
        const deliveryCode = savedOrder.deliveryCode || "";

        customerNameElement.textContent =
            `Thank you, ${customerName}!`;

        orderNumberElement.textContent = orderNumber;

        orderTotalElement.textContent =
            `SAR ${total.toFixed(2)}`;

        orderStatusElement.textContent = status;

        if (deliveryCodeElement) {
            if (/^\d{6}$/.test(String(deliveryCode))) {
                deliveryCodeElement.textContent = deliveryCode;
            } else {
                deliveryCodeElement.textContent =
                    "Code unavailable — contact BARQ support";
            }
        }

    } catch (error) {
        console.error("Order success page error:", error);

        if (deliveryCodeElement) {
            deliveryCodeElement.textContent = "Unable to load code";
        }
    }
}

showOrderSuccess();
