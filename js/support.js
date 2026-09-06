import {
    auth,
    db,
    doc,
    collection,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    serverTimestamp,
    increment
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


// ======================================================
// CONFIG
// ======================================================

const TREES_PER_DOLLAR = 5;


// ======================================================
// ELEMENTS
// ======================================================

// Donation controls
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

// Donation modal
const donationModalElement =
    document.getElementById("donationModal");

const donationForm =
    document.getElementById("donationForm");

const checkoutAmount =
    document.getElementById("checkoutAmount");

const checkoutTrees =
    document.getElementById("checkoutTrees");

// Success modal
const successModalElement =
    document.getElementById("successModal");

const successTrees =
    document.getElementById("successTrees");

// Personal impact
const userTrees =
    document.getElementById("userTrees");

const userDonated =
    document.getElementById("userDonated");

const userDonations =
    document.getElementById("userDonations");

// Payment fields
const cardName =
    document.getElementById("cardName");

const cardNumber =
    document.getElementById("cardNumber");

const expiryDate =
    document.getElementById("expiryDate");

const cvv =
    document.getElementById("cvv");


// ======================================================
// BOOTSTRAP MODALS
// ======================================================

let donationModal = null;
let successModal = null;

if (donationModalElement) {
    donationModal =
        new bootstrap.Modal(donationModalElement);
}

if (successModalElement) {
    successModal =
        new bootstrap.Modal(successModalElement);
}


// ======================================================
// CURRENT USER
// ======================================================

let currentUser = null;


// ======================================================
// CURRENT DONATION
// ======================================================

let selectedAmount = 1;


// ======================================================
// FORMAT MONEY
// ======================================================

function formatMoney(amount) {

    return `$${Number(amount || 0).toLocaleString("en-US")}`;

}


// ======================================================
// CALCULATE TREES
// ======================================================

function calculateTrees(amount) {

    return Math.floor(
        Number(amount) * TREES_PER_DOLLAR
    );

}


// ======================================================
// UPDATE DONATION DISPLAY
// ======================================================

function updateDonationDisplay(amount) {

    amount = Math.floor(Number(amount));

    if (!amount || amount < 1) {
        return;
    }

    selectedAmount = amount;

    const trees =
        calculateTrees(amount);


    if (donationAmount) {

        donationAmount.textContent =
            `$${amount}`;

    }


    if (treeAmount) {

        treeAmount.textContent =
            trees.toLocaleString();

    }


    if (donateBtn) {

        donateBtn.innerHTML = `
            <i class="bi bi-heart-fill"></i>
            Donate $${amount}
        `;

    }

}


// ======================================================
// PRESET DONATION BUTTONS
// ======================================================

donationOptions.forEach((button) => {

    button.addEventListener("click", () => {

        const amount =
            Number(button.dataset.amount);


        if (!amount || amount < 1) {
            return;
        }


        // Remove old selection
        donationOptions.forEach((option) => {

            option.classList.remove("selected");

        });


        // Select clicked option
        button.classList.add("selected");


        // Clear custom input
        if (customAmount) {
            customAmount.value = "";
        }


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
        donationOptions.forEach((option) => {

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

        // Must be logged in
        if (!currentUser) {

            alert(
                "Please log in before making a donation."
            );

            window.location.href = "auth.html";

            return;

        }


        // Validate amount
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


        // Update checkout summary
        if (checkoutAmount) {

            checkoutAmount.textContent =
                `$${selectedAmount}`;

        }


        if (checkoutTrees) {

            checkoutTrees.textContent =
                trees.toLocaleString();

        }


        // Open modal
        if (donationModal) {
            donationModal.show();
        }

    });

}


// ======================================================
// CARD NUMBER FORMATTING
// ======================================================

if (cardNumber) {

    cardNumber.addEventListener("input", () => {

        let value =
            cardNumber.value
                .replace(/\D/g, "")
                .substring(0, 16);


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

if (expiryDate) {

    expiryDate.addEventListener("input", () => {

        let value =
            expiryDate.value
                .replace(/\D/g, "")
                .substring(0, 4);


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

if (cvv) {

    cvv.addEventListener("input", () => {

        cvv.value =
            cvv.value
                .replace(/\D/g, "")
                .substring(0, 3);

    });

}


// ======================================================
// LOAD PERSONAL IMPACT
// ======================================================

async function loadPersonalImpact() {

    // Make sure elements exist
    if (
        !userTrees ||
        !userDonated ||
        !userDonations
    ) {
        return;
    }


    // Logged out state
    if (!currentUser) {

        userTrees.textContent = "0";
        userDonated.textContent = "$0";
        userDonations.textContent = "0";

        return;

    }


    try {

        const accountRef =
            doc(
                db,
                "accounts",
                currentUser.uid
            );


        const accountSnapshot =
            await getDoc(accountRef);


        // No account
        if (!accountSnapshot.exists()) {

            userTrees.textContent = "0";
            userDonated.textContent = "$0";
            userDonations.textContent = "0";

            return;

        }


        const accountData =
            accountSnapshot.data();


        const donationStats =
            accountData.donationStats || {};


        // Total trees
        userTrees.textContent =
            Number(
                donationStats.totalTrees || 0
            ).toLocaleString();


        // Total donated
        userDonated.textContent =
            formatMoney(
                donationStats.totalDonated || 0
            );


        // Donation history
        const donationsRef =
            collection(
                db,
                "accounts",
                currentUser.uid,
                "donations"
            );


        const donationsSnapshot =
            await getDocs(donationsRef);


        let completedDonations = 0;


        donationsSnapshot.forEach((donationDoc) => {

            const donation =
                donationDoc.data();


            if (
                donation.status ===
                "completed"
            ) {

                completedDonations++;

            }

        });


        userDonations.textContent =
            completedDonations;

    }

    catch (error) {

        console.error(
            "Unable to load personal impact:",
            error
        );


        userTrees.textContent = "0";
        userDonated.textContent = "$0";
        userDonations.textContent = "0";

    }

}


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    await loadPersonalImpact();

});


// ======================================================
// DONATION FORM
// ======================================================

if (donationForm) {

    donationForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // ==========================================
            // CHECK LOGIN
            // ==========================================

            if (!currentUser) {

                alert(
                    "Your session has expired. Please log in again."
                );


                if (donationModal) {
                    donationModal.hide();
                }


                window.location.href =
                    "auth.html";


                return;

            }


            // ==========================================
            // GET FORM VALUES
            // ==========================================

            const enteredCardName =
                cardName?.value
                    .trim() || "";


            const enteredCardNumber =
                cardNumber?.value
                    .replace(/\s/g, "") || "";


            const enteredExpiry =
                expiryDate?.value
                    .trim() || "";


            const enteredCvv =
                cvv?.value
                    .trim() || "";


            // ==========================================
            // VALIDATION
            // ==========================================

            if (!enteredCardName) {

                alert(
                    "Please enter the name on the card."
                );

                return;

            }


            if (
                !/^\d{16}$/.test(
                    enteredCardNumber
                )
            ) {

                alert(
                    "Please enter a valid 16-digit demo card number."
                );

                return;

            }


            if (
                !/^\d{2}\/\d{2}$/.test(
                    enteredExpiry
                )
            ) {

                alert(
                    "Please enter the expiry date as MM/YY."
                );

                return;

            }


            if (
                !/^\d{3}$/.test(
                    enteredCvv
                )
            ) {

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
                paymentButton
                    ? paymentButton.innerHTML
                    : "";


            if (paymentButton) {

                paymentButton.disabled =
                    true;


                paymentButton.innerHTML = `
                    <span
                        class="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                    ></span>
                    Processing...
                `;

            }


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
                // SAVE DONATION HISTORY
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
                        donatedAt: serverTimestamp()
                    }
                );


                // ======================================
                // UPDATE PERSONAL STATS
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
                // CLOSE DONATION MODAL
                // ======================================

                if (donationModal) {
                    donationModal.hide();
                }


                // ======================================
                // UPDATE SUCCESS MODAL
                // ======================================

                if (successTrees) {

                    successTrees.textContent =
                        trees.toLocaleString();

                }


                // ======================================
                // RESET FORM
                // ======================================

                donationForm.reset();


                // ======================================
                // REFRESH PERSONAL IMPACT
                // ======================================

                await loadPersonalImpact();


                // ======================================
                // SHOW SUCCESS MODAL
                // ======================================

                setTimeout(() => {

                    if (successModal) {
                        successModal.show();
                    }

                }, 300);

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

                if (paymentButton) {

                    paymentButton.disabled =
                        false;


                    paymentButton.innerHTML =
                        originalText;

                }

            }

        }
    );

}


// ======================================================
// INITIAL STATE
// ======================================================

updateDonationDisplay(1);


// Select $1 by default
const firstOption =
    document.querySelector(
        '.donation-option[data-amount="1"]'
    );


if (firstOption) {

    firstOption.classList.add("selected");

}