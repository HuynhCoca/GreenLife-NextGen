import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// CONFIG
// =====================================================

const PLANS = {
    Leaf: {
        monthly: 39000,
        yearly: 390000
    },

    Grow: {
        monthly: 79000,
        yearly: 790000
    },

    "Impact Pro": {
        monthly: 129000,
        yearly: 1290000
    },

    "Impact+": {
        monthly: 199000,
        yearly: 1990000
    }
};


let billingCycle = "monthly";
let selectedPlan = "Grow";
let currentUser = null;


// =====================================================
// DOM
// =====================================================

const monthlyBillingBtn = document.getElementById("monthlyBillingBtn");
const yearlyBillingBtn = document.getElementById("yearlyBillingBtn");
const billingMessage = document.getElementById("billingMessage");

const upgradeButtons = document.querySelectorAll(".upgrade-plan");

const paymentModalElement =
    document.getElementById("premiumPaymentModal");

const successModalElement =
    document.getElementById("premiumSuccessModal");

const paymentForm =
    document.getElementById("premiumPaymentForm");

const selectedPremiumPlan =
    document.getElementById("selectedPremiumPlan");

const selectedPremiumPrice =
    document.getElementById("selectedPremiumPrice");

const premiumCardName =
    document.getElementById("premiumCardName");

const premiumCardNumber =
    document.getElementById("premiumCardNumber");

const premiumExpiry =
    document.getElementById("premiumExpiry");

const premiumCvv =
    document.getElementById("premiumCvv");


// Bootstrap modals
let paymentModal = null;
let successModal = null;

if (paymentModalElement) {
    paymentModal = new bootstrap.Modal(paymentModalElement);
}

if (successModalElement) {
    successModal = new bootstrap.Modal(successModalElement);
}


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(auth, (user) => {
    currentUser = user;
});


// =====================================================
// HELPERS
// =====================================================

function formatPrice(value) {
    return new Intl.NumberFormat("vi-VN").format(value) + "₫";
}


function getCurrentPrice(planName) {

    const plan = PLANS[planName];

    if (!plan) {
        return 0;
    }

    return billingCycle === "monthly"
        ? plan.monthly
        : plan.yearly;
}


function getPriceLabel(planName) {

    const price = getCurrentPrice(planName);

    if (billingCycle === "monthly") {
        return `${formatPrice(price)} / month`;
    }

    return `${formatPrice(price)} / year`;
}


// =====================================================
// UPDATE PRICES
// =====================================================

function updatePrices() {

    const priceElements =
        document.querySelectorAll(".plan-price .price[data-monthly]");

    priceElements.forEach((element) => {

        const monthlyPrice =
            Number(
                element
                    .dataset
                    .monthly
                    .replace(/[^\d]/g, "")
            );

        const yearlyPrice =
            Number(
                element
                    .dataset
                    .yearly
                    .replace(/[^\d]/g, "")
            );


        if (billingCycle === "monthly") {

            element.textContent =
                formatPrice(monthlyPrice);

        } else {

            element.textContent =
                formatPrice(yearlyPrice);

        }

    });


    const periodElements =
        document.querySelectorAll(".plan-price .period");

    periodElements.forEach((element) => {

        element.textContent =
            billingCycle === "monthly"
                ? "/ month"
                : "/ year";

    });


    updateYearlyNotes();
}


// =====================================================
// YEARLY NOTES
// =====================================================

function updateYearlyNotes() {

    const yearlyNotes =
        document.querySelectorAll(".yearly-note");

    yearlyNotes.forEach((note) => {

        const text =
            note.querySelector("[data-yearly-text]");

        if (!text) {
            return;
        }

        text.textContent =
            billingCycle === "monthly"
                ? text.textContent
                : text.textContent;

    });

}


// =====================================================
// BILLING TOGGLE
// =====================================================

function setBillingCycle(cycle) {

    billingCycle = cycle;

    if (monthlyBillingBtn) {
        monthlyBillingBtn.classList.toggle(
            "active",
            cycle === "monthly"
        );
    }

    if (yearlyBillingBtn) {
        yearlyBillingBtn.classList.toggle(
            "active",
            cycle === "yearly"
        );
    }


    if (billingMessage) {

        if (cycle === "monthly") {

            billingMessage.innerHTML = `
                Pay monthly and stay flexible.
            `;

        } else {

            billingMessage.innerHTML = `
                <i class="bi bi-stars"></i>
                Save more with yearly billing.
            `;

        }

    }


    updatePrices();

    // Update open modal if necessary
    updateSelectedPlanDisplay();
}


// =====================================================
// SELECT PLAN
// =====================================================

function selectPlan(planName) {

    if (!PLANS[planName]) {
        console.error("Unknown plan:", planName);
        return;
    }

    selectedPlan = planName;

    updateSelectedPlanDisplay();

    if (paymentModal) {
        paymentModal.show();
    }
}


// =====================================================
// UPDATE PAYMENT MODAL
// =====================================================

function updateSelectedPlanDisplay() {

    if (selectedPremiumPlan) {

        selectedPremiumPlan.textContent =
            selectedPlan;

    }

    if (selectedPremiumPrice) {

        selectedPremiumPrice.textContent =
            getPriceLabel(selectedPlan);

    }

}


// =====================================================
// PLAN BUTTONS
// =====================================================

upgradeButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const planName =
            button.dataset.plan;

        if (!planName) {
            return;
        }

        selectPlan(planName);

    });

});


// =====================================================
// BILLING BUTTONS
// =====================================================

if (monthlyBillingBtn) {

    monthlyBillingBtn.addEventListener(
        "click",
        () => {
            setBillingCycle("monthly");
        }
    );

}


if (yearlyBillingBtn) {

    yearlyBillingBtn.addEventListener(
        "click",
        () => {
            setBillingCycle("yearly");
        }
    );

}


// =====================================================
// CARD NUMBER FORMATTING
// =====================================================

if (premiumCardNumber) {

    premiumCardNumber.addEventListener(
        "input",
        (event) => {

            let value =
                event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 16);

            value =
                value.match(/.{1,4}/g)?.join(" ")
                || "";

            event.target.value = value;

        }
    );

}


// =====================================================
// EXPIRY FORMATTING
// =====================================================

if (premiumExpiry) {

    premiumExpiry.addEventListener(
        "input",
        (event) => {

            let value =
                event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 4);

            if (value.length >= 3) {

                value =
                    value.slice(0, 2) +
                    "/" +
                    value.slice(2);

            }

            event.target.value = value;

        }
    );

}


// =====================================================
// CVV
// =====================================================

if (premiumCvv) {

    premiumCvv.addEventListener(
        "input",
        (event) => {

            event.target.value =
                event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 4);

        }
    );

}


// =====================================================
// VALIDATION
// =====================================================

function validatePaymentForm() {

    const name =
        premiumCardName?.value.trim();

    const cardNumber =
        premiumCardNumber?.value
            .replace(/\s/g, "");

    const expiry =
        premiumExpiry?.value.trim();

    const cvv =
        premiumCvv?.value.trim();


    if (!name) {

        alert("Please enter the cardholder name.");

        return false;

    }


    if (!/^\d{16}$/.test(cardNumber)) {

        alert(
            "Please enter a valid 16-digit demo card number."
        );

        return false;

    }


    if (!/^\d{2}\/\d{2}$/.test(expiry)) {

        alert(
            "Please enter the expiry date in MM/YY format."
        );

        return false;

    }


    if (!/^\d{3,4}$/.test(cvv)) {

        alert(
            "Please enter a valid demo CVV."
        );

        return false;

    }


    return true;

}


// =====================================================
// SAVE SUBSCRIPTION
// =====================================================

async function saveSubscription() {

    if (!currentUser) {

        throw new Error(
            "You must be logged in to activate Premium."
        );

    }


    const plan =
        PLANS[selectedPlan];

    if (!plan) {

        throw new Error(
            "Invalid subscription plan."
        );

    }


    const price =
        getCurrentPrice(selectedPlan);


    const accountRef =
        doc(
            db,
            "accounts",
            currentUser.uid
        );


    await setDoc(
        accountRef,
        {
            subscription: {

                plan: selectedPlan,

                billingCycle: billingCycle,

                price: price,

                currency: "VND",

                status: "active",

                startedAt: serverTimestamp()

            }

        },
        {
            merge: true
        }
    );

}


// =====================================================
// PAYMENT SUBMIT
// =====================================================

if (paymentForm) {

    paymentForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // Login check
            if (!currentUser) {

                alert(
                    "Please log in before upgrading to GreenLife Premium."
                );

                if (paymentModal) {
                    paymentModal.hide();
                }

                window.location.href = "auth.html";

                return;

            }


            // Form validation
            if (!validatePaymentForm()) {
                return;
            }


            const submitButton =
                paymentForm.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                submitButton?.innerHTML;


            try {

                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.innerHTML = `
                        <span
                            class="spinner-border spinner-border-sm me-2"
                            aria-hidden="true"
                        ></span>
                        Activating...
                    `;

                }


                // Save subscription to Firestore
                await saveSubscription();


                // IMPORTANT:
                // We never save the card details.


                if (paymentModal) {
                    paymentModal.hide();
                }


                // Reset payment fields
                paymentForm.reset();


                // Show success modal
                setTimeout(() => {

                    if (successModal) {
                        successModal.show();
                    }

                }, 300);


            } catch (error) {

                console.error(
                    "Premium activation error:",
                    error
                );

                alert(
                    "Something went wrong while activating Premium. Please try again."
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled = false;

                    submitButton.innerHTML =
                        originalText ||
                        `
                            Complete Upgrade
                            <i class="bi bi-arrow-right"></i>
                        `;

                }

            }

        }
    );

}


// =====================================================
// INITIALIZE
// =====================================================

setBillingCycle("monthly");


// =====================================================
// UPDATE MODAL WHEN OPENED
// =====================================================

if (paymentModalElement) {

    paymentModalElement.addEventListener(
        "show.bs.modal",
        () => {
            updateSelectedPlanDisplay();
        }
    );

}