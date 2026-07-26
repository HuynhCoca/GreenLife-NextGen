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

function showMessage(message, success = true) {

    const status = document.getElementById("statusMessage");

    status.textContent = message;

    status.className = success ? "status success" : "status error";

}
// ==============================
// FORM SWITCHING
// ==============================

const forms = document.querySelectorAll(".form");
const tabs = document.querySelectorAll(".tab-btn");

function showForm(formId) {

    forms.forEach(form => {
        form.classList.remove("active");
    });

    tabs.forEach(tab => {
        tab.classList.remove("active");
    });

    document.getElementById(formId).classList.add("active");

    if (formId === "loginForm") {
        document
            .querySelector('[data-mode="login"]')
            .classList.add("active");
    }

    if (formId === "signupForm") {
        document
            .querySelector('[data-mode="signup"]')
            .classList.add("active");
    }

}

// Login / Signup Tabs

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        if (tab.dataset.mode === "login") {

            showForm("loginForm");

        } else {

            showForm("signupForm");

        }

    });

});

// Forgot Password

document
    .getElementById("forgotPasswordBtn")
    ?.addEventListener("click", () => {

        showForm("resetForm");

    });

// Back To Login

document
    .getElementById("backToLoginBtn")
    ?.addEventListener("click", () => {

        showForm("loginForm");

    });


// ==============================
// LOGIN
// ==============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();

        const password = document.getElementById("loginPassword").value;

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            showMessage("Login successful!");

            window.location.href = "index.html";

        }

        catch (error) {

            showMessage(error.message, false);

        }

    });

}

// ==============================
// REGISTER
// ==============================

const signupForm = document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = document.getElementById("signupName").value.trim();

        const email = document.getElementById("signupEmail").value.trim();

        const password = document.getElementById("signupPassword").value;

        const confirm = document.getElementById("confirmPassword").value;

        if (password !== confirm) {

            showMessage("Passwords do not match.", false);

            return;

        }

        try {

            const credential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = credential.user;

            await setDoc(doc(db, "accounts", user.uid), {

                uid: user.uid,

                name,

                email,

                isAdmin: false,

                createdAt: serverTimestamp()

            });

            showMessage("Account created successfully!");

            window.location.href = "index.html";

        }

        catch (error) {

            showMessage(error.message, false);

        }

    });

}

// ==============================
// RESET PASSWORD
// ==============================

const resetForm = document.getElementById("resetForm");

if (resetForm) {

    resetForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("resetEmail").value.trim();

        try {

            await sendPasswordResetEmail(auth, email);

            showMessage("Password reset email sent.");

        }

        catch (error) {

            showMessage(error.message, false);

        }

    });

}