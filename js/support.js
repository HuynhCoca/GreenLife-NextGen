import {
    auth,
    db,
    doc,
    collection,
    addDoc,
    setDoc,
    getDoc,
    serverTimestamp,
    increment
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


// ======================================================
// CONSTANTS
// ======================================================

const TREES_PER_DOLLAR = 5;


// ======================================================
// ELEMENTS
// ======================================================

const donationOptions =
    document.querySelectorAll(".donation-option");

const customAmount =
    document.getElementById("customAmount");

const donationAmount =
    document.getElementById("donationAmount");

const treeAmount =
    document.getElementById("treeAmount");

const donateBtn =
    document.getElementById("donateBtn");

const donationModalElement =
    document.getElementById("donationModal");

const donationForm =
    document.getElementById("donationForm");

const checkoutAmount =
    document.getElementById("checkoutAmount");

const checkoutTrees =
    document.getElementById("checkoutTrees");

const successTrees =
    document.getElementById("successTrees");


// ======================================================
// BOOTSTRAP MODALS
// ======================================================

const donationModal =
    new bootstrap.Modal(donationModalElement);

const successModalElement =
    document.getElementById("successModal");

const successModal =
    new bootstrap.Modal(successModalElement);


// ======================================================
// CURRENT USER
// ======================================================

let currentUser = null;


// ======================================================
// CURRENT DONATION
// ======================================================

let selectedAmount = 1;


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, (user) => {

    currentUser = user;

    console.log(
        "Current user:",
        currentUser
    );

});


// ======================================================
// CALCULATE TREES
// ======================================================

function calculateTrees(amount) {

    return amount * TREES_PER_DOLLAR;

}


// ======================================================
// UPDATE DONATION DISPLAY
// ======================================================

function updateDonationDisplay(amount) {

    selectedAmount = amount;

    const trees =
        calculateTrees(amount);


    donationAmount.textContent =
        `$${amount}`;


    treeAmount.textContent =
        trees;


    donateBtn.innerHTML = `
        <i class="bi bi-heart-fill"></i>
        Donate $${amount}
    `;

}


// ======================================================
// PRESET DONATION BUTTONS
// ======================================================

donationOptions.forEach(button => {

    button.addEventListener("click", () => {

        const amount =
            Number(button.dataset.amount);


        if (!amount || amount < 1) {
            return;
        }


        // Remove selected state

        donationOptions.forEach(option => {

            option.classList.remove("selected");

        });


        // Select current button

        button.classList.add("selected");


        // Clear custom amount

        customAmount.value = "";


        updateDonationDisplay(amount);

    });

});


// ======================================================
// CUSTOM DONATION
// ======================================================

if (customAmount) {

    customAmount.addEventListener("input", () => {

        let amount =
            Number(customAmount.value);


        if (!amount || amount < 1) {

            return;

        }


        amount =
            Math.floor(amount);


        // Remove preset selection

        donationOptions.forEach(option => {

            option.classList.remove("selected");

        });


        updateDonationDisplay(amount);

    });

}


// ======================================================
// DONATE BUTTON
// ======================================================

if (donateBtn) {

    donateBtn.addEventListener("click", () => {


        // ==============================================
        // CHECK LOGIN
        // ==============================================

        if (!currentUser) {

            alert(
                "Please log in before making a donation."
            );

            window.location.href =
                "auth.html";

            return;

        }


        // ==============================================
        // VALIDATE AMOUNT
        // ==============================================

        if (
            !selectedAmount ||
            selectedAmount < 1
        ) {

            alert(
                "Please select a donation amount."
            );

            return;

        }


        const trees =
            calculateTrees(selectedAmount);


        // ==============================================
        // UPDATE CHECKOUT
        // ==============================================

        checkoutAmount.textContent =
            `$${selectedAmount}`;


        checkoutTrees.textContent =
            trees;


        // ==============================================
        // OPEN MODAL
        // ==============================================

        donationModal.show();

    });

}


// ======================================================
// CARD NUMBER FORMATTING
// ======================================================

const cardNumber =
    document.getElementById("cardNumber");


if (cardNumber) {

    cardNumber.addEventListener("input", () => {

        let value =
            cardNumber.value.replace(/\D/g, "");


        value =
            value.substring(0, 16);


        value =
            value
                .replace(/(.{4})/g, "$1 ")
                .trim();


        cardNumber.value =
            value;

    });

}


// ======================================================
// EXPIRY DATE FORMATTING
// ======================================================

const expiryDate =
    document.getElementById("expiryDate");


if (expiryDate) {

    expiryDate.addEventListener("input", () => {

        let value =
            expiryDate.value.replace(/\D/g, "");


        value =
            value.substring(0, 4);


        if (value.length >= 3) {

            value =
                value.substring(0, 2)
                + "/"
                + value.substring(2);

        }


        expiryDate.value =
            value;

    });

}


// ======================================================
// CVV FORMATTING
// ======================================================

const cvv =
    document.getElementById("cvv");


if (cvv) {

    cvv.addEventListener("input", () => {

        cvv.value =
            cvv.value
                .replace(/\D/g, "")
                .substring(0, 3);

    });

}


// ======================================================
// DONATION FORM
// ======================================================

if (donationForm) {

    donationForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // ==========================================
            // CHECK LOGIN AGAIN
            // ==========================================

            if (!currentUser) {

                alert(
                    "Your session has expired. Please log in again."
                );

                donationModal.hide();

                window.location.href =
                    "auth.html";

                return;

            }


            // ==========================================
            // FORM VALUES
            // ==========================================

            const cardName =
                document
                    .getElementById("cardName")
                    .value
                    .trim();


            const card =
                document
                    .getElementById("cardNumber")
                    .value
                    .replace(/\s/g, "");


            const expiry =
                document
                    .getElementById("expiryDate")
                    .value
                    .trim();


            const cvvValue =
                document
                    .getElementById("cvv")
                    .value
                    .trim();


            // ==========================================
            // VALIDATION
            // ==========================================

            if (!cardName) {

                alert(
                    "Please enter the name on the card."
                );

                return;

            }


            if (card.length !== 16) {

                alert(
                    "Please enter a valid 16-digit demo card number."
                );

                return;

            }


            if (!/^\d{2}\/\d{2}$/.test(expiry)) {

                alert(
                    "Please enter the expiry date as MM/YY."
                );

                return;

            }


            if (cvvValue.length !== 3) {

                alert(
                    "Please enter a 3-digit CVV."
                );

                return;

            }


            // ==========================================
            // CALCULATE IMPACT
            // ==========================================

            const amount =
                selectedAmount;

            const trees =
                calculateTrees(amount);


            // ==========================================
            // PAYMENT BUTTON
            // ==========================================

            const paymentButton =
                donationForm.querySelector(
                    ".payment-btn"
                );


            const originalText =
                paymentButton.innerHTML;


            paymentButton.disabled =
                true;


            paymentButton.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm"
                    aria-hidden="true">
                </span>

                Processing...
            `;


            try {

                // ======================================
                // ACCOUNT REFERENCE
                // ======================================

                const accountRef =
                    doc(
                        db,
                        "accounts",
                        currentUser.uid
                    );


                // ======================================
                // CHECK ACCOUNT
                // ======================================

                const accountSnapshot =
                    await getDoc(accountRef);


                if (!accountSnapshot.exists()) {

                    throw new Error(
                        "Your account could not be found."
                    );

                }


                // ======================================
                // SAVE INDIVIDUAL DONATION
                // ======================================

                const donationsRef =
                    collection(
                        db,
                        "accounts",
                        currentUser.uid,
                        "donations"
                    );


                await addDoc(
                    donationsRef,
                    {

                        amount: amount,

                        trees: trees,

                        status: "completed",

                        donatedAt:
                            serverTimestamp()

                    }
                );


                // ======================================
                // UPDATE DONATION STATS
                // ======================================

                await setDoc(

                    accountRef,

                    {

                        donationStats: {

                            totalDonated:
                                increment(amount),

                            totalTrees:
                                increment(trees)

                        }

                    },

                    {
                        merge: true
                    }

                );


                console.log(
                    "Donation saved successfully."
                );


                // ======================================
                // CLOSE PAYMENT MODAL
                // ======================================

                donationModal.hide();


                // ======================================
                // UPDATE SUCCESS MODAL
                // ======================================

                successTrees.textContent =
                    trees;


                // ======================================
                // SHOW SUCCESS
                // ======================================

                setTimeout(() => {

                    successModal.show();

                }, 300);


                // ======================================
                // RESET FORM
                // ======================================

                donationForm.reset();

            }


            catch (error) {

                console.error(
                    "Donation error:",
                    error
                );


                alert(
                    "Something went wrong while processing your donation."
                );

            }


            finally {

                paymentButton.disabled =
                    false;


                paymentButton.innerHTML =
                    originalText;

            }

        }
    );

}


// ======================================================
// INITIAL STATE
// ======================================================

updateDonationDisplay(1);


// Select $1 button initially

const firstOption =
    document.querySelector(
        '.donation-option[data-amount="1"]'
    );


if (firstOption) {

    firstOption.classList.add("selected");

}