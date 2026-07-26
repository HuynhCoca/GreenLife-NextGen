import {
    auth,
    db,
    onAuthStateChanged,
    doc,
    getDoc
} from "./firebase.js";

const navActions = document.getElementById("navActions");

onAuthStateChanged(auth, async (user) => {

    // ------------------------------
    // Guest
    // ------------------------------

    if (!user) {

        navActions.innerHTML = `
            <a href="auth.html" class="btn-login">
                Login
            </a>
        `;

        return;

    }

    // ------------------------------
    // Get Account
    // ------------------------------

    const snap = await getDoc(
        doc(db, "accounts", user.uid)
    );

    if (!snap.exists()) {

        navActions.innerHTML = `
            <a href="auth.html" class="btn-login">
                Login
            </a>
        `;

        return;

    }

    const account = snap.data();

    // ------------------------------
    // Admin Button
    // ------------------------------

    const dashboardButton = account.isAdmin
        ? `
        <a href="dashboard.html" class="btn-dashboard">
            Dashboard
        </a>
        `
        : "";

    // ------------------------------
    // Logged In
    // ------------------------------

    navActions.innerHTML = `

        ${dashboardButton}

        <span class="username">
            👋 ${account.name}
        </span>

        <button
            id="logoutBtn"
            class="btn-login">

            Logout

        </button>

    `;

    document
        .getElementById("logoutBtn")
        .addEventListener("click", async () => {

            await auth.signOut();

        });

});