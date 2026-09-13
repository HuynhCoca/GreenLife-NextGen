/* ======================================================
   GREENLIFE USER DASHBOARD
====================================================== */

import {
    auth,
    db,
    doc,
    getDoc
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


// ======================================================
// CONFIG
// ======================================================

const COMMUNITY_GOAL = 2000;


// ======================================================
// DOM ELEMENTS
// ======================================================

const userName = document.getElementById("userName");
const currentDate = document.getElementById("currentDate");

const plantCount = document.getElementById("plantCount");
const impactTrees = document.getElementById("impactTrees");
const greenStreak = document.getElementById("greenStreak");
const badgeCount = document.getElementById("badgeCount");

const savedPlants = document.getElementById("savedPlants");

const subscriptionPlan =
    document.getElementById("subscriptionPlan");

const subscriptionStatus =
    document.getElementById("subscriptionStatus");

const billingCycle =
    document.getElementById("billingCycle");

const subscriptionPrice =
    document.getElementById("subscriptionPrice");

const membershipAction =
    document.getElementById("membershipAction");

const impactTreeLarge =
    document.getElementById("impactTreeLarge");

const donationCount =
    document.getElementById("donationCount");

const totalDonated =
    document.getElementById("totalDonated");

const communityTrees =
    document.getElementById("communityTrees");

const communityGoal =
    document.getElementById("communityGoal");

const communityProgress =
    document.getElementById("communityProgress");

const communityPercentage =
    document.getElementById("communityPercentage");

const streakNumber =
    document.getElementById("streakNumber");

const streakMessage =
    document.getElementById("streakMessage");

const achievementSummary =
    document.getElementById("achievementSummary");


// ======================================================
// STATE
// ======================================================

let currentUser = null;
let accountData = null;


// ======================================================
// DATE
// ======================================================

function displayCurrentDate() {
    if (!currentDate) {
        return;
    }

    const today = new Date();

    currentDate.textContent =
        today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
}


// ======================================================
// FORMAT MONEY
// ======================================================

function formatVND(value) {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}


// ======================================================
// LOAD USER ACCOUNT
// ======================================================

async function loadUserAccount(user) {
    if (!user) {
        return;
    }

    try {
        const accountRef = doc(
            db,
            "accounts",
            user.uid
        );

        const snapshot = await getDoc(accountRef);

        if (!snapshot.exists()) {
            console.error(
                "Account document not found."
            );

            return;
        }

        accountData = snapshot.data();

        renderAccount(accountData);

    } catch (error) {
        console.error(
            "Failed to load dashboard:",
            error
        );
    }
}


// ======================================================
// RENDER ACCOUNT
// ======================================================

function renderAccount(data) {
    renderUserProfile(data);
    renderImpact(data);
    renderSubscription(data);
    renderPlants(data);
    renderFutureStats(data);
}


// ======================================================
// USER PROFILE
// ======================================================

function renderUserProfile(data) {
    if (!userName) {
        return;
    }

    userName.textContent =
        data.name ||
        currentUser?.displayName ||
        currentUser?.email?.split("@")[0] ||
        "Green Friend";
}


// ======================================================
// IMPACT
// ======================================================

function renderImpact(data) {
    const stats =
        data.donationStats || {};

    const trees =
        Number(stats.totalTrees || 0);

    const donated =
        Number(stats.totalDonated || 0);

    const donations =
        Array.isArray(data.donations)
            ? data.donations.length
            : 0;


    if (impactTrees) {
        impactTrees.textContent =
            trees.toLocaleString();
    }

    if (impactTreeLarge) {
        impactTreeLarge.textContent =
            trees.toLocaleString();
    }

    if (donationCount) {
        donationCount.textContent =
            donations.toLocaleString();
    }

    if (totalDonated) {
        totalDonated.textContent =
            formatVND(donated);
    }


    renderCommunityGoal(trees);
}


// ======================================================
// COMMUNITY GOAL
// ======================================================

function renderCommunityGoal(userTrees) {
    const current =
        Number(userTrees || 0);

    const percentage =
        Math.min(
            (current / COMMUNITY_GOAL) * 100,
            100
        );


    if (communityTrees) {
        communityTrees.textContent =
            current.toLocaleString();
    }

    if (communityGoal) {
        communityGoal.textContent =
            COMMUNITY_GOAL.toLocaleString();
    }

    if (communityProgress) {
        communityProgress.style.width =
            `${percentage}%`;
    }

    if (communityPercentage) {
        communityPercentage.textContent =
            `${Math.round(percentage)}% complete`;
    }
}


// ======================================================
// SUBSCRIPTION
// ======================================================

function renderSubscription(data) {
    const subscription =
        data.subscription || {
            plan: "Free",
            status: "inactive",
            billingCycle: null,
            price: 0,
            currency: "VND"
        };


    const plan =
        subscription.plan || "Free";

    const status =
        subscription.status || "inactive";

    const cycle =
        subscription.billingCycle;

    const price =
        Number(subscription.price || 0);


    if (subscriptionPlan) {
        subscriptionPlan.textContent =
            plan;
    }


    if (subscriptionStatus) {

        if (status === "active") {

            subscriptionStatus.textContent =
                "Premium membership active";

        } else {

            subscriptionStatus.textContent =
                "Free membership";

        }
    }


    if (billingCycle) {

        if (cycle === "monthly") {

            billingCycle.textContent =
                "Monthly";

        } else if (cycle === "yearly") {

            billingCycle.textContent =
                "Yearly";

        } else {

            billingCycle.textContent =
                "None";

        }
    }


    if (subscriptionPrice) {

        subscriptionPrice.textContent =
            price > 0
                ? formatVND(price)
                : "0₫";

    }


    if (membershipAction) {

        if (
            status === "active" &&
            plan !== "Free"
        ) {

            membershipAction.textContent =
                "Manage Premium";

            membershipAction.href =
                "premium.html";

        } else {

            membershipAction.innerHTML = `
                Explore Premium
                <i class="bi bi-arrow-right"></i>
            `;

            membershipAction.href =
                "premium.html";
        }
    }
}


// ======================================================
// SAVED PLANTS
// ======================================================

function renderPlants(data) {

    /*
        Saved plants are not stored in the current
        account structure yet.

        Keep the empty state until we build the
        actual Favorites feature.
    */

    const saved =
        Array.isArray(data.savedPlants)
            ? data.savedPlants
            : [];


    if (plantCount) {
        plantCount.textContent =
            saved.length;
    }


    if (!savedPlants) {
        return;
    }


    if (!saved.length) {

        savedPlants.innerHTML = `
            <div class="empty-dashboard">
                <div class="empty-icon">
                    <i class="bi bi-flower1"></i>
                </div>

                <h3>No plants yet</h3>

                <p>
                    Explore Eco Tips and save your
                    first plant.
                </p>

                <a
                    href="eco-tips.html"
                    class="small-primary-btn"
                >
                    Discover Plants
                </a>
            </div>
        `;

        return;
    }


    /*
        This section is ready for the Favorites
        feature once we store actual plant data.
    */

    savedPlants.innerHTML = "";

    saved.slice(0, 4).forEach((plant) => {

        const element =
            createSavedPlant(plant);

        savedPlants.appendChild(
            element
        );

    });
}


// ======================================================
// CREATE SAVED PLANT
// ======================================================

function createSavedPlant(plant) {

    const element =
        document.createElement("div");

    element.className =
        "dashboard-plant";


    const image =
        escapeHTML(
            plant.image ||
            "images/plant-placeholder.jpg"
        );

    const name =
        escapeHTML(
            plant.name ||
            "Unknown Plant"
        );

    const category =
        escapeHTML(
            plant.category ||
            "Plant"
        );


    element.innerHTML = `
        <div class="dashboard-plant-image">
            <img
                src="${image}"
                alt="${name}"
                loading="lazy"
            >
        </div>

        <div class="dashboard-plant-info">
            <strong>${name}</strong>
            <span>${category}</span>
        </div>

        <a
            href="eco-tips.html"
            class="dashboard-plant-action"
            aria-label="Explore plant"
        >
            <i class="bi bi-arrow-right"></i>
        </a>
    `;


    return element;
}


// ======================================================
// FUTURE FEATURES
// ======================================================

function renderFutureStats(data) {

    /*
        These are intentionally not connected to fake
        Firebase values yet.

        They will become real when we build:
        - Green Streak
        - Achievements
        - Challenges
        - Goals
    */

    const streak =
        Number(data.greenStreak || 0);

    const achievements =
        Array.isArray(data.achievements)
            ? data.achievements.length
            : 0;


    if (greenStreak) {
        greenStreak.textContent =
            streak;
    }

    if (streakNumber) {
        streakNumber.textContent =
            streak;
    }


    if (badgeCount) {
        badgeCount.textContent =
            achievements;
    }


    if (achievementSummary) {
        achievementSummary.textContent =
            `${achievements} unlocked`;
    }


    if (streakMessage) {

        if (streak > 0) {

            streakMessage.textContent =
                `Keep going! You're on a ${streak}-day green streak.`;

        } else {

            streakMessage.textContent =
                "Start your first green action today.";

        }
    }


    updateAchievementCards(
        achievements
    );
}


// ======================================================
// ACHIEVEMENTS UI
// ======================================================

function updateAchievementCards(count) {

    const achievements =
        document.querySelectorAll(
            ".achievement"
        );


    if (!achievements.length) {
        return;
    }


    achievements.forEach(
        (achievement, index) => {

            if (index < count) {

                achievement.classList.remove(
                    "locked"
                );

            } else {

                achievement.classList.add(
                    "locked"
                );

            }

        }
    );
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "auth.html";

            return;

        }


        currentUser = user;

        displayCurrentDate();

        await loadUserAccount(
            user
        );

    }
);