import {
    auth,
    db,
    onAuthStateChanged,
    doc,
    getDoc
} from "./firebase.js";

const navActions = document.getElementById("navActions");

onAuthStateChanged(auth, async (user) => {
    if (!navActions) {
        return;
    }

    // ======================================================
    // GUEST
    // ======================================================

    if (!user) {
        navActions.innerHTML = `
            <a href="auth.html" class="nav-login">
                Login
            </a>
        `;

        return;
    }

    // ======================================================
    // GET ACCOUNT
    // ======================================================

    try {
        const accountSnapshot = await getDoc(
            doc(db, "accounts", user.uid)
        );

        if (!accountSnapshot.exists()) {
            navActions.innerHTML = `
                <a href="auth.html" class="nav-login">
                    Login
                </a>
            `;

            return;
        }

        const account = accountSnapshot.data();

        // ==================================================
        // SUBSCRIPTION
        // ==================================================

        const subscription = account.subscription || {
            plan: "Free",
            status: "inactive"
        };

        const plan = subscription.plan || "Free";

        const isPremium =
            subscription.status === "active" &&
            plan !== "Free";

        // ==================================================
        // ADMIN MENU ITEM
        // ==================================================

        const adminMenuItem = account.isAdmin
            ? `
                <a href="dashboard.html" class="profile-menu-item">
                    <span class="profile-menu-icon">
                        <i class="bi bi-speedometer2"></i>
                    </span>

                    <span>
                        <strong>Admin Dashboard</strong>
                        <small>Manage GreenLife</small>
                    </span>
                </a>
            `
            : "";

        // ==================================================
        // PREMIUM MENU ITEM
        // ==================================================

        const premiumMenuItem = isPremium
            ? `
                <a href="premium.html" class="profile-menu-item">
                    <span class="profile-menu-icon premium">
                        <i class="bi bi-stars"></i>
                    </span>

                    <span>
                        <strong>Premium</strong>
                        <small>${plan} Member</small>
                    </span>
                </a>
            `
            : `
                <a href="premium.html" class="profile-menu-item">
                    <span class="profile-menu-icon premium">
                        <i class="bi bi-stars"></i>
                    </span>

                    <span>
                        <strong>Premium</strong>
                        <small>Explore plans</small>
                    </span>
                </a>
            `;

        // ==================================================
        // PROFILE DROPDOWN
        // ==================================================

        navActions.innerHTML = `
            <div class="profile-menu" id="profileMenu">

                <button
                    type="button"
                    class="profile-button"
                    id="profileButton"
                    aria-expanded="false"
                    aria-haspopup="true"
                >
                    <span class="profile-avatar">
                        <i class="bi bi-person-fill"></i>
                    </span>

                    <span class="profile-name">
                        ${escapeHTML(account.name || "User")}
                    </span>

                    <i class="bi bi-chevron-down profile-arrow"></i>
                </button>

                <div
                    class="profile-dropdown"
                    id="profileDropdown"
                >

                    <div class="profile-header">

                        <div class="profile-header-avatar">
                            <i class="bi bi-person-fill"></i>
                        </div>

                        <div>
                            <strong>
                                ${escapeHTML(account.name || "User")}
                            </strong>

                            <span>
                                ${escapeHTML(account.email || user.email || "")}
                            </span>
                        </div>

                    </div>

                    <div class="profile-divider"></div>

                    <a
                        href="user-dashboard.html"
                        class="profile-menu-item"
                    >
                        <span class="profile-menu-icon">
                            <i class="bi bi-person-circle"></i>
                        </span>

                        <span>
                            <strong>My Dashboard</strong>
                            <small>Your GreenLife journey</small>
                        </span>
                    </a>

                    <a
                        href="support.html"
                        class="profile-menu-item"
                    >
                        <span class="profile-menu-icon">
                            <i class="bi bi-heart"></i>
                        </span>

                        <span>
                            <strong>My Impact</strong>
                            <small>View your contributions</small>
                        </span>
                    </a>

                    ${premiumMenuItem}

                    ${adminMenuItem}

                    <div class="profile-divider"></div>

                    <button
                        type="button"
                        id="logoutBtn"
                        class="profile-logout"
                    >
                        <span class="profile-menu-icon logout-icon">
                            <i class="bi bi-box-arrow-right"></i>
                        </span>

                        <span>
                            <strong>Logout</strong>
                            <small>Sign out of GreenLife</small>
                        </span>
                    </button>

                </div>
            </div>
        `;

        initializeProfileMenu();

    } catch (error) {
        console.error(
            "Failed to load navbar account:",
            error
        );

        navActions.innerHTML = `
            <a href="auth.html" class="nav-login">
                Login
            </a>
        `;
    }
});


// ======================================================
// PROFILE MENU
// ======================================================

function initializeProfileMenu() {
    const profileButton =
        document.getElementById("profileButton");

    const profileDropdown =
        document.getElementById("profileDropdown");

    const profileMenu =
        document.getElementById("profileMenu");

    const logoutButton =
        document.getElementById("logoutBtn");

    if (
        !profileButton ||
        !profileDropdown ||
        !profileMenu
    ) {
        return;
    }

    // ==================================================
    // OPEN / CLOSE
    // ==================================================

    profileButton.addEventListener("click", (event) => {
        event.stopPropagation();

        const isOpen =
            profileMenu.classList.contains("open");

        closeProfileMenu();

        if (!isOpen) {
            profileMenu.classList.add("open");
            profileButton.setAttribute(
                "aria-expanded",
                "true"
            );
        }
    });

    // ==================================================
    // PREVENT DROPDOWN CLICK FROM BUBBLING
    // ==================================================

    profileDropdown.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
        }
    );

    // ==================================================
    // CLOSE OUTSIDE
    // ==================================================

    document.addEventListener("click", () => {
        closeProfileMenu();
    });

    // ==================================================
    // ESCAPE KEY
    // ==================================================

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeProfileMenu();
        }
    });

    // ==================================================
    // LOGOUT
    // ==================================================

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            async () => {
                try {
                    await auth.signOut();
                } catch (error) {
                    console.error(
                        "Logout failed:",
                        error
                    );
                }
            }
        );
    }
}


// ======================================================
// CLOSE PROFILE MENU
// ======================================================

function closeProfileMenu() {
    const profileMenu =
        document.getElementById("profileMenu");

    const profileButton =
        document.getElementById("profileButton");

    if (profileMenu) {
        profileMenu.classList.remove("open");
    }

    if (profileButton) {
        profileButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}