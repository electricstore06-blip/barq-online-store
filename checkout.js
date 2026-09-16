/* ==============================
   BARQ CHECKOUT JAVASCRIPT
============================== */

document.addEventListener("DOMContentLoaded", function () {

    const fullName = document.getElementById("full-name");
    const phone = document.getElementById("phone");
    const email = document.getElementById("email");
    const address = document.getElementById("address");

    const paymentMethods = document.querySelectorAll(
        'input[name="payment"]'
    );

    const placeOrderButton = document.querySelector(
        '.checkout-box button'
    );


    /* ==============================
       PLACE ORDER
    ============================== */

    placeOrderButton.addEventListener("click", function () {

        const nameValue = fullName.value.trim();
        const phoneValue = phone.value.trim();
        const emailValue = email.value.trim();
        const addressValue = address.value.trim();

        let selectedPayment = "";

        paymentMethods.forEach(function (payment) {

            if (payment.checked) {
                selectedPayment = payment.value;
            }

        });


        /* ==============================
           VALIDATION
        ============================== */

        if (nameValue === "") {

            alert("Please enter your full name.");
            fullName.focus();
            return;

        }


        if (phoneValue === "") {

            alert("Please enter your phone number.");
            phone.focus();
            return;

        }


        /* Saudi phone number validation */

        const phonePattern = /^05\d{8}$/;

        if (!phonePattern.test(phoneValue)) {

            alert(
                "Please enter a valid Saudi phone number.\nExample: 05xxxxxxxx"
            );

            phone.focus();
            return;

        }


        if (emailValue === "") {

            alert("Please enter your email address.");
            email.focus();
            return;

        }


        /* Email validation */

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(emailValue)) {

            alert("Please enter a valid email address.");
            email.focus();
            return;

        }


        if (addressValue === "") {

            alert("Please enter your delivery address.");
            address.focus();
            return;

        }


        if (selectedPayment === "") {

            alert("Please select a payment method.");

            return;

        }


        /* ==============================
           ORDER SUCCESS
        ============================== */

        alert(
            "Order placed successfully!\n\n" +
            "Thank you, " + nameValue + "!\n" +
            "Payment Method: " + selectedPayment
        );


        /* ==============================
           CLEAR FORM
        ============================== */

        fullName.value = "";
        phone.value = "";
        email.value = "";
        address.value = "";


        paymentMethods.forEach(function (payment) {

            payment.checked = false;

        });

    });

});
