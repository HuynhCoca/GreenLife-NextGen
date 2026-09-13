import {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "./firebase.js";


// ======================================================
// MESSAGE
// ======================================================

function showMessage(message, success = true) {

    const status =
        document.getElementById("statusMessage");

    if (!status) {
        return;
    }

    status.textContent = message;

    status.className =
        success
            ? "status success"
            : "status error";
}


// ======================================================
// DEFAULT SUBSCRIPTION
// ======================================================

const DEFAULT_SUBSCRIPTION = {

    plan: "Free",

    billingCycle: null,

    price: 0,

    currency: "VND",

    status: "inactive",

    startedAt: null

};


// ======================================================
// MAKE SURE ACCOUNT HAS SUBSCRIPTION
// ======================================================

async function ensureSubscription(user) {

    if (!user) {
        return;
    }


    const accountRef =
        doc(
            db,
            "accounts",
            user.uid
        );


    const accountSnapshot =
        await getDoc(accountRef);


    // Account does not exist
    if (!accountSnapshot.exists()) {

        await setDoc(
            accountRef,
            {
                uid: user.uid,

                email:
                    user.email || "",

                subscription:
                    DEFAULT_SUBSCRIPTION
            },
            {
                merge: true
            }
        );

        return;
    }


    const accountData =
        accountSnapshot.data();


    /*
        Old accounts were created before
        the Premium system existed.

        Add the default subscription only
        when the field is missing.
    */

    if (!accountData.subscription) {

        await setDoc(
            accountRef,
            {
                subscription:
                    DEFAULT_SUBSCRIPTION
            },
            {
                merge: true
            }
        );

        console.log(
            "Added default Free subscription to existing account."
        );

    }

}


// ======================================================
// FORM SWITCHING
// ======================================================

const forms =
    document.querySelectorAll(".form");

const tabs =
    document.querySelectorAll(".tab-btn");


function showForm(formId) {

    forms.forEach(form => {

        form.classList.remove(
            "active"
        );

    });


    tabs.forEach(tab => {

        tab.classList.remove(
            "active"
        );

    });


    const selectedForm =
        document.getElementById(formId);


    if (selectedForm) {

        selectedForm.classList.add(
            "active"
        );

    }


    if (formId === "loginForm") {

        const loginTab =
            document.querySelector(
                '[data-mode="login"]'
            );


        if (loginTab) {

            loginTab.classList.add(
                "active"
            );

        }

    }


    if (formId === "signupForm") {

        const signupTab =
            document.querySelector(
                '[data-mode="signup"]'
            );


        if (signupTab) {

            signupTab.classList.add(
                "active"
            );

        }

    }

}


// ======================================================
// LOGIN / SIGNUP TABS
// ======================================================

tabs.forEach(tab => {

    tab.addEventListener(
        "click",
        () => {

            if (
                tab.dataset.mode ===
                "login"
            ) {

                showForm(
                    "loginForm"
                );

            } else {

                showForm(
                    "signupForm"
                );

            }

        }
    );

});


// ======================================================
// FORGOT PASSWORD
// ======================================================

document
    .getElementById("forgotPasswordBtn")
    ?.addEventListener(
        "click",
        () => {

            showForm(
                "resetForm"
            );

        }
    );


// ======================================================
// BACK TO LOGIN
// ======================================================

document
    .getElementById("backToLoginBtn")
    ?.addEventListener(
        "click",
        () => {

            showForm(
                "loginForm"
            );

        }
    );


// ======================================================
// LOGIN
// ======================================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;


            try {

                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                /*
                    IMPORTANT:

                    This repairs old accounts
                    that do not have a subscription
                    field yet.
                */

                await ensureSubscription(
                    credential.user
                );


                showMessage(
                    "Login successful!"
                );


                window.location.href =
                    "index.html";

            }

            catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                showMessage(
                    error.message,
                    false
                );

            }

        }
    );

}


// ======================================================
// REGISTER
// ======================================================

const signupForm =
    document.getElementById(
        "signupForm"
    );


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const name =
                document
                    .getElementById(
                        "signupName"
                    )
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "signupEmail"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "signupPassword"
                    )
                    .value;


            const confirm =
                document
                    .getElementById(
                        "confirmPassword"
                    )
                    .value;


            // ------------------------------------------
            // PASSWORD MATCH
            // ------------------------------------------

            if (
                password !==
                confirm
            ) {

                showMessage(
                    "Passwords do not match.",
                    false
                );

                return;

            }


            try {

                // --------------------------------------
                // CREATE FIREBASE USER
                // --------------------------------------

                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                // --------------------------------------
                // CREATE ACCOUNT DOCUMENT
                // --------------------------------------

                await setDoc(
                    doc(
                        db,
                        "accounts",
                        user.uid
                    ),
                    {

                        uid:
                            user.uid,

                        name:
                            name,

                        email:
                            email,

                        isAdmin:
                            false,

                        createdAt:
                            serverTimestamp(),

                        donations:
                            [],

                        donationStats: {

                            totalDonated:
                                0,

                            totalTrees:
                                0

                        },


                        // =================================
                        // PREMIUM DEFAULT
                        // =================================

                        subscription:
                            DEFAULT_SUBSCRIPTION

                    }
                );


                console.log(
                    "Account created with Free subscription."
                );


                showMessage(
                    "Account created successfully!"
                );


                window.location.href =
                    "index.html";

            }

            catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                showMessage(
                    error.message,
                    false
                );

            }

        }
    );

}


// ======================================================
// RESET PASSWORD
// ======================================================

const resetForm =
    document.getElementById(
        "resetForm"
    );


if (resetForm) {

    resetForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const email =
                document
                    .getElementById(
                        "resetEmail"
                    )
                    .value
                    .trim();


            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );


                showMessage(
                    "Password reset email sent."
                );

            }

            catch (error) {

                console.error(
                    "Password reset error:",
                    error
                );


                showMessage(
                    error.message,
                    false
                );

            }

        }
    );

}