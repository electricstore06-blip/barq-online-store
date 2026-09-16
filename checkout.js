/* ==============================
   BARQ CHECKOUT JAVASCRIPT
============================== */


/* ==============================
   GET ELEMENTS
============================== */

const fullName = document.getElementById("full-name");
const phone = document.getElementById("phone");
const email = document.getElementById("email");
const address = document.getElementById("address");

const paymentOptions = document.querySelectorAll(
    'input[name="payment"]'
);

const placeOrderButton = document.querySelector(
    ".checkout-box button"
);


/* ==============================
   PLACE ORDER
============================== */

placeOrderButton.addEventListener("click", function () {

    /* Remove previous error messages */

    clearErrors();


    /* Get values */

    const nameValue = fullName.value.trim();
    const phoneValue = phone.value.trim();
    const emailValue = email.value.trim();
    const addressValue = address.value.trim();


    /* ==============================
       VALIDATION
    ============================== */

    let hasError = false;


    /* Full Name */

    if (nameValue === "") {

        showError(
            fullName,
            "Please enter your full name."
        );

        hasError = true;

    }


    /* Phone Number */

    else if (!/^05\d{8}$/.test(phoneValue)) {

        showError(
            phone,
            "Please enter a valid Saudi phone number (05xxxxxxxx)."
        );

        hasError = true;

    }


    /* Email */

    if (emailValue === "") {

        showError(
            email,
            "Please enter your email address."
        );

        hasError = true;

    }

    else if (!isValidEmail(emailValue)) {

        showError(
            email,
            "Please enter a valid email address."
        );

        hasError = true;

    }


    /* Delivery Address */

    if (addressValue === "") {

        showError(
            address,
            "Please enter your delivery address."
        );

        hasError = true;

    }


    /* Payment Method */

    let selectedPayment = "";

    paymentOptions.forEach(function (option) {

        if (option.checked) {

            selectedPayment = option.value;

        }

    });


    if (selectedPayment === "") {

        showPaymentError();

        hasError = true;

    }


    /* Stop if there is an error */

    if (hasError) {

        return;

    }


    /* ==============================
       CREATE ORDER
    ============================== */

    const order = {

        customerName: nameValue,

        phone: phoneValue,

        email: emailValue,

        address: addressValue,

        payment: selectedPayment,

        date: new Date().toISOString()

    };


    /* Save order */

    localStorage.setItem(
        "barqOrder",
        JSON.stringify(order)
    );


    /* ==============================
       SUCCESS MESSAGE
    ============================== */

    showSuccessMessage();

});


/* ==============================
   EMAIL VALIDATION
============================== */

function isValidEmail(email) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);

}


/* ==============================
   SHOW INPUT ERROR
============================== */

function showError(input, message) {

    input.style.borderColor = "#d81b60";

    input.style.boxShadow =
        "0 0 0 3px rgba(216,27,96,0.10)";


    const error = document.createElement("div");

    error.className = "checkout-error";

    error.textContent = message;

    error.style.color = "#d81b60";

    error.style.fontSize = "14px";

    error.style.marginTop = "6px";

    error.style.fontWeight = "normal";


    input.insertAdjacentElement(
        "afterend",
        error
    );

}


/* ==============================
   PAYMENT ERROR
============================== */

function showPaymentError() {

    const paymentHeading =
        document.querySelector(
            ".checkout-box h2:not(.customer-title)"
        );


    if (!paymentHeading) {
        return;
    }


    const error = document.createElement("div");

    error.className = "checkout-error";

    error.textContent =
        "Please select a payment method.";

    error.style.color = "#d81b60";

    error.style.fontSize = "14px";

    error.style.marginTop = "8px";

    error.style.fontWeight = "normal";


    paymentHeading.insertAdjacentElement(
        "afterend",
        error
    );

}


/* ==============================
   CLEAR ERRORS
============================== */

function clearErrors() {

    const errors =
        document.querySelectorAll(
            ".checkout-error"
        );


    errors.forEach(function (error) {

        error.remove();

    });


    const inputs =
        document.querySelectorAll(
            ".checkout-box input[type='text'], " +
            ".checkout-box input[type='tel'], " +
            ".checkout-box input[type='email'], " +
            ".checkout-box textarea"
        );


    inputs.forEach(function (input) {

        input.style.borderColor = "#d7d7d7";

        input.style.boxShadow = "none";

    });

}


/* ==============================
   SUCCESS MESSAGE
============================== */

function showSuccessMessage() {

    const checkoutBox =
        document.querySelector(".checkout-box");


    checkoutBox.innerHTML = `

        <div class="order-success">

            <div class="success-icon">
                ✓
            </div>

            <h2>
                Order Placed Successfully!
            </h2>

            <p>
                Thank you for shopping with BARQ.
            </p>

            <p>
                Your order information has been saved.
            </p>

            <button
                type="button"
                id="back-to-store"
            >
                Back to Store
            </button>

        </div>

    `;


    /* Back to store button */

    const backButton =
        document.getElementById(
            "back-to-store"
        );


    backButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "index.html";

        }
    );

}
