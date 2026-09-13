/* ======================================================
   ECO TIPS — GREENLIFE + PERENUAL
   ====================================================== */

import {
    auth,
    db,
    onAuthStateChanged,
    doc,
    getDoc,
    setDoc
} from "./firebase.js";

const API_KEY = "KEY_HERE";

const API_BASE = "https://www.perenual.com/api/v2";


// ======================================================
// CONFIG
// ======================================================

const PLANTS_PER_PAGE = 9;
const API_RESULTS_PER_PAGE = 30;


// ======================================================
// DOM ELEMENTS
// ======================================================

const plantGrid =
    document.getElementById("plantGrid");

const searchInput =
    document.getElementById("plantSearch");

const clearSearch =
    document.getElementById("clearSearch");

const sortFilter =
    document.getElementById("plantSort");

const loadingState =
    document.getElementById("plantLoading");

const emptyState =
    document.getElementById("plantEmpty");

const errorState =
    document.getElementById("plantError");

const retryButton =
    document.getElementById("retryPlants");

const plantModal =
    document.getElementById("plantModal");

const plantModalContent =
    document.getElementById("plantModalContent");

const plantPagination =
    document.getElementById("plantPagination");

const plantCount =
    document.getElementById("plantCount");

const explorerStatus =
    document.getElementById("explorerStatus");

const categoryFilters =
    document.getElementById("categoryFilters");


// ======================================================
// STATE
// ======================================================

let plants = [];

let currentSearch = "";

let currentCategory = "all";

let currentSort = "default";

let currentApiPage = 1;

let currentLocalPage = 1;

let totalLocalPages = 1;

// ======================================================
// FAVORITES
// ======================================================

let currentUser = null;
let savedPlantIds = new Set();

// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeSearch();
    initializeFilters();
    initializeRetry();
    updateClearButton();
    updateDonationLikeDefaults();

    onAuthStateChanged(auth, async (user) => {
        currentUser = user;

        await loadFavorites();
        await loadPlants(1);
    });
});


// ======================================================
// LOAD PLANTS FROM PERENUAL
// ======================================================

async function loadPlants(apiPage = 1) {

    showLoading();

    currentApiPage = apiPage;

    currentLocalPage = 1;

    try {

        if (
            !API_KEY ||
            API_KEY === "YOUR_PERENUAL_API_KEY"
        ) {

            throw new Error(
                "Perenual API key is missing."
            );

        }


        let url =
            `${API_BASE}/species-list` +
            `?key=${encodeURIComponent(API_KEY)}` +
            `&page=${apiPage}`;


        // Search query
        if (currentSearch) {

            url +=
                `&q=${encodeURIComponent(currentSearch)}`;

        }


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `Perenual API error: ${response.status}`
            );

        }


        const result =
            await response.json();


        plants =
            Array.isArray(result.data)
                ? result.data.map((plant) => ({

                    ...plant,

                    greenlifeCategory:
                        getPlantCategory(plant)

                }))
                : [];


        updatePlantCount();

        applyFilters();

    }

    catch (error) {

        console.error(
            "Failed to load plants:",
            error
        );

        showError();

        if (explorerStatus) {

            explorerStatus.textContent =
                "Unable to load plants";

        }

    }

}


// ======================================================
// SEARCH
// ======================================================

function initializeSearch() {

    if (!searchInput) {
        return;
    }


    /*
        Search only when Enter is pressed.
        This prevents unnecessary API requests.
    */

    searchInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key !== "Enter") {
                return;
            }


            event.preventDefault();


            currentSearch =
                searchInput.value.trim();


            currentApiPage = 1;

            currentLocalPage = 1;


            updateClearButton();

            loadPlants(1);

        }
    );


    /*
        Update clear button
    */

    searchInput.addEventListener(
        "input",
        updateClearButton
    );


    /*
        Clear search
    */

    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            () => {

                searchInput.value = "";

                currentSearch = "";

                currentApiPage = 1;

                currentLocalPage = 1;


                updateClearButton();

                loadPlants(1);

            }
        );

    }

}


// ======================================================
// CLEAR SEARCH BUTTON
// ======================================================

function updateClearButton() {

    if (
        !clearSearch ||
        !searchInput
    ) {
        return;
    }


    clearSearch.classList.toggle(
        "visible",
        searchInput.value.trim().length > 0
    );

}


// ======================================================
// FILTERS + SORT
// ======================================================

function initializeFilters() {

    /*
        CATEGORY BUTTONS
    */

    if (categoryFilters) {

        const buttons =
            categoryFilters.querySelectorAll(
                ".category-btn"
            );


        buttons.forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    buttons.forEach((btn) => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                    button.classList.add(
                        "active"
                    );


                    currentCategory =
                        button.dataset.category ||
                        "all";


                    currentLocalPage = 1;


                    applyFilters();

                }
            );

        });

    }


    /*
        SORT DROPDOWN
    */

    if (sortFilter) {

        sortFilter.addEventListener(
            "change",
            () => {

                currentSort =
                    sortFilter.value;


                currentLocalPage = 1;


                applyFilters();

            }
        );

    }

}


// ======================================================
// CATEGORY SYSTEM
// ======================================================

function getPlantCategory(plant) {

    const searchableText =
        getSearchablePlantText(plant);


    // -----------------------------------------------
    // SUCCULENTS
    // -----------------------------------------------

    const succulentKeywords = [

        "succulent",
        "cactus",
        "aloe",
        "haworthia",
        "echeveria",
        "sedum",
        "crassula",
        "kalanchoe"

    ];


    if (
        containsKeyword(
            searchableText,
            succulentKeywords
        )
    ) {

        return "shrub";

    }


    // -----------------------------------------------
    // HERBS
    // -----------------------------------------------

    const herbKeywords = [

        "basil",
        "mint",
        "thyme",
        "rosemary",
        "sage",
        "oregano",
        "parsley",
        "cilantro",
        "coriander",
        "chive",
        "dill",
        "lavender",
        "lemongrass"

    ];


    if (
        containsKeyword(
            searchableText,
            herbKeywords
        )
    ) {

        return "herb";

    }


    // -----------------------------------------------
    // FLOWERS
    // -----------------------------------------------

    const flowerKeywords = [

        "rose",
        "orchid",
        "tulip",
        "daisy",
        "lily",
        "hibiscus",
        "sunflower",
        "jasmine",
        "marigold",
        "petunia",
        "violet",
        "dahlia",
        "chrysanthemum",
        "carnation",
        "begonia",
        "geranium",
        "hydrangea",
        "magnolia",
        "peony"

    ];


    if (
        containsKeyword(
            searchableText,
            flowerKeywords
        )
    ) {

        return "flower";

    }


    // -----------------------------------------------
    // TREES
    // -----------------------------------------------

    const treeKeywords = [

        "oak",
        "pine",
        "maple",
        "cedar",
        "spruce",
        "fir",
        "birch",
        "willow",
        "elm",
        "palm",
        "sequoia",
        "redwood",
        "eucalyptus",
        "acacia",
        "apple tree",
        "cherry tree",
        "mango tree",
        "lemon tree",
        "orange tree",
        "olive tree",
        "fig tree",
        "peach tree",
        "pear tree"

    ];


    if (
        containsKeyword(
            searchableText,
            treeKeywords
        )
    ) {

        return "tree";

    }


    // -----------------------------------------------
    // INDOOR PLANTS
    // -----------------------------------------------

    if (plant.indoor === true) {

        return "shrub";

    }


    // -----------------------------------------------
    // DEFAULT
    // -----------------------------------------------

    return "other";

}


// ======================================================
// SEARCHABLE PLANT TEXT
// ======================================================

function getSearchablePlantText(plant) {

    const commonName =
        plant.common_name || "";


    const scientificName =
        Array.isArray(plant.scientific_name)
            ? plant.scientific_name.join(" ")
            : plant.scientific_name || "";


    const family =
        plant.family || "";


    return `
        ${commonName}
        ${scientificName}
        ${family}
    `.toLowerCase();

}


// ======================================================
// KEYWORD CHECK
// ======================================================

function containsKeyword(
    text,
    keywords
) {

    return keywords.some(
        (keyword) =>
            text.includes(
                keyword.toLowerCase()
            )
    );

}


// ======================================================
// APPLY FILTERS
// ======================================================

function applyFilters() {

    let result =
        [...plants];


    // -----------------------------------------------
    // CATEGORY FILTER
    // -----------------------------------------------

    if (
        currentCategory &&
        currentCategory !== "all"
    ) {

        result =
            result.filter(
                (plant) =>
                    plant.greenlifeCategory ===
                    currentCategory
            );

    }


    // -----------------------------------------------
    // SORT
    // -----------------------------------------------

    if (currentSort === "name-asc") {

        result.sort(
            (a, b) =>
                getPlantName(a)
                    .localeCompare(
                        getPlantName(b)
                    )
        );

    }

    else if (currentSort === "name-desc") {

        result.sort(
            (a, b) =>
                getPlantName(b)
                    .localeCompare(
                        getPlantName(a)
                    )
        );

    }


    // -----------------------------------------------
    // LOCAL PAGINATION
    // -----------------------------------------------

    totalLocalPages =
        Math.max(
            1,
            Math.ceil(
                result.length /
                PLANTS_PER_PAGE
            )
        );


    if (
        currentLocalPage >
        totalLocalPages
    ) {

        currentLocalPage =
            totalLocalPages;

    }


    const startIndex =
        (currentLocalPage - 1) *
        PLANTS_PER_PAGE;


    const endIndex =
        startIndex +
        PLANTS_PER_PAGE;


    const visiblePlants =
        result.slice(
            startIndex,
            endIndex
        );


    renderPlants(
        visiblePlants,
        result.length
    );


    renderPagination();

    updateExplorerStatus(
        result.length
    );

}


// ======================================================
// PAGINATION
// ======================================================

function renderPagination() {

    if (!plantPagination) {
        return;
    }


    plantPagination.innerHTML = "";


    /*
        There are two levels:

        API page:
        30 plants

        Website page:
        9 plants

        Therefore one API page can have
        4 local website pages.
    */


    const hasPreviousLocalPage =
        currentLocalPage > 1;


    const hasPreviousApiPage =
        currentLocalPage === 1 &&
        currentApiPage > 1;


    const hasPrevious =
        hasPreviousLocalPage ||
        hasPreviousApiPage;


    const previousButton =
        createPaginationButton(
            "Previous",
            !hasPrevious,
            `<i class="bi bi-chevron-left"></i>`
        );


    previousButton.addEventListener(
        "click",
        () => {

            if (currentLocalPage > 1) {

                currentLocalPage--;

                applyFilters();

                scrollToExplorer();

                return;

            }


            if (currentApiPage > 1) {

                loadPlants(
                    currentApiPage - 1
                ).then(() => {

                    currentLocalPage =
                        totalLocalPages;

                    applyFilters();

                    scrollToExplorer();

                });

            }

        }
    );


    plantPagination.appendChild(
        previousButton
    );


    // -----------------------------------------------
    // LOCAL PAGE NUMBERS
    // -----------------------------------------------

    for (
        let page = 1;
        page <= totalLocalPages;
        page++
    ) {

        const pageButton =
            createPaginationButton(
                String(page),
                false,
                String(page)
            );


        if (
            page ===
            currentLocalPage
        ) {

            pageButton.classList.add(
                "active"
            );

        }


        pageButton.addEventListener(
            "click",
            () => {

                if (
                    page ===
                    currentLocalPage
                ) {
                    return;
                }


                currentLocalPage =
                    page;


                applyFilters();

                scrollToExplorer();

            }
        );


        plantPagination.appendChild(
            pageButton
        );

    }


    // -----------------------------------------------
    // NEXT BUTTON
    // -----------------------------------------------

    const hasNextLocalPage =
        currentLocalPage <
        totalLocalPages;


    /*
        Since Perenual returns another API page,
        we can move into the next batch.
    */

    const hasNext =
        hasNextLocalPage ||
        plants.length >= API_RESULTS_PER_PAGE;


    const nextButton =
        createPaginationButton(
            "Next",
            !hasNext,
            `<i class="bi bi-chevron-right"></i>`
        );


    nextButton.addEventListener(
        "click",
        () => {

            if (
                currentLocalPage <
                totalLocalPages
            ) {

                currentLocalPage++;

                applyFilters();

                scrollToExplorer();

                return;

            }


            /*
                Load next API page.
            */

            loadPlants(
                currentApiPage + 1
            ).then(() => {

                currentLocalPage = 1;

                applyFilters();

                scrollToExplorer();

            });

        }
    );


    plantPagination.appendChild(
        nextButton
    );

}


// ======================================================
// CREATE PAGINATION BUTTON
// ======================================================

function createPaginationButton(
    ariaLabel,
    disabled,
    content
) {

    const button =
        document.createElement(
            "button"
        );


    button.type = "button";

    button.className =
        "pagination-btn";


    button.setAttribute(
        "aria-label",
        ariaLabel
    );


    button.innerHTML =
        content;


    button.disabled =
        disabled;


    return button;

}


// ======================================================
// SCROLL BACK TO EXPLORER
// ======================================================

function scrollToExplorer() {

    const explorer =
        document.querySelector(
            ".plant-explorer"
        );


    if (!explorer) {
        return;
    }


    const top =
        explorer.getBoundingClientRect().top +
        window.scrollY -
        90;


    window.scrollTo({
        top: top,
        behavior: "smooth"
    });

}


// ======================================================
// RENDER PLANTS
// ======================================================

function renderPlants(
    data,
    filteredCount
) {

    hideLoading();

    hideError();


    if (!plantGrid) {
        return;
    }


    plantGrid.innerHTML = "";


    if (!data.length) {

        showEmpty();

        updateExplorerStatus(
            filteredCount || 0
        );

        return;

    }


    hideEmpty();


    data.forEach(
        (plant) => {

            const card =
                createPlantCard(
                    plant
                );


            plantGrid.appendChild(
                card
            );

        }
    );

}

// ======================================================
// LOAD FAVORITES
// ======================================================

async function loadFavorites() {
    savedPlantIds = new Set();

    if (!currentUser) {
        return;
    }

    try {
        const accountRef = doc(
            db,
            "accounts",
            currentUser.uid
        );

        const snapshot = await getDoc(accountRef);

        if (!snapshot.exists()) {
            return;
        }

        const account = snapshot.data();

        const savedPlants = Array.isArray(
            account.savedPlants
        )
            ? account.savedPlants
            : [];

        savedPlantIds = new Set(
            savedPlants.map(
                plant => String(plant.id)
            )
        );
    }

    catch (error) {
        console.error(
            "Failed to load favorite plants:",
            error
        );
    }
}


// ======================================================
// TOGGLE FAVORITE
// ======================================================

async function toggleFavorite(
    plant,
    button
) {
    if (!currentUser) {
        alert(
            "Please log in to save your favorite plants."
        );

        window.location.href = "auth.html";

        return;
    }

    if (!plant.id) {
        return;
    }

    const plantId = String(plant.id);

    const accountRef = doc(
        db,
        "accounts",
        currentUser.uid
    );

    try {
        button.disabled = true;

        const snapshot = await getDoc(
            accountRef
        );

        if (!snapshot.exists()) {
            throw new Error(
                "Account document not found."
            );
        }

        const account = snapshot.data();

        const savedPlants =
            Array.isArray(account.savedPlants)
                ? account.savedPlants
                : [];

        const existingIndex =
            savedPlants.findIndex(
                savedPlant =>
                    String(savedPlant.id) === plantId
            );

        if (existingIndex !== -1) {
            // ==========================================
            // REMOVE FAVORITE
            // ==========================================

            savedPlants.splice(
                existingIndex,
                1
            );

            savedPlantIds.delete(
                plantId
            );

            updateFavoriteButton(
                button,
                false
            );
        }

        else {
            // ==========================================
            // ADD FAVORITE
            // ==========================================

            const savedPlant = {
                id: plant.id,
                name: getPlantName(plant),
                scientificName:
                    getScientificName(plant),
                image: getPlantImage(plant),
                category:
                    getCategoryLabel(
                        plant.greenlifeCategory
                    )
            };

            savedPlants.push(
                savedPlant
            );

            savedPlantIds.add(
                plantId
            );

            updateFavoriteButton(
                button,
                true
            );
        }

        // ==========================================
        // SAVE PLAIN ARRAY TO FIRESTORE
        // ==========================================

        await setDoc(
            accountRef,
            {
                savedPlants: savedPlants
            },
            {
                merge: true
            }
        );

    }

    catch (error) {
        console.error(
            "Failed to update favorite:",
            error
        );

        alert(
            "We couldn't update your favorites. Please try again."
        );

        // Reload the correct state if the save failed
        await loadFavorites();

        updateFavoriteButton(
            button,
            savedPlantIds.has(plantId)
        );
    }

    finally {
        button.disabled = false;
    }
}


// ======================================================
// UPDATE FAVORITE BUTTON
// ======================================================

function updateFavoriteButton(
    button,
    isSaved
) {
    if (!button) {
        return;
    }

    button.classList.toggle(
        "active",
        isSaved
    );

    button.innerHTML = `
        <i class="bi ${
            isSaved
                ? "bi-heart-fill"
                : "bi-heart"
        }"></i>
    `;

    button.setAttribute(
        "aria-label",
        isSaved
            ? "Remove from favorites"
            : "Add to favorites"
    );

    button.title =
        isSaved
            ? "Remove from favorites"
            : "Save plant";
}

// ======================================================
// CREATE PLANT CARD
// ======================================================

function createPlantCard(plant) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "plant-card";


    const name =
        getPlantName(plant);


    const scientificName =
        getScientificName(plant);


    const image =
        getPlantImage(plant);


    const category =
        getCategoryLabel(
            plant.greenlifeCategory
        );


    const categoryTip =
        getCategoryTip(
            plant.greenlifeCategory
        );


    card.innerHTML = `

        <div class="plant-image-wrapper">

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
                loading="lazy"
                onerror="this.src='images/plant-placeholder.jpg'"
            >

            <button
                type="button"
                class="favorite-btn ${
                    savedPlantIds.has(String(plant.id))
                        ? "active"
                        : ""
                }"
                aria-label="${
                    savedPlantIds.has(String(plant.id))
                        ? "Remove from favorites"
                        : "Add to favorites"
                }"
                title="${
                    savedPlantIds.has(String(plant.id))
                        ? "Remove from favorites"
                        : "Save plant"
                }"
            >
                <i class="bi ${
                    savedPlantIds.has(String(plant.id))
                        ? "bi-heart-fill"
                        : "bi-heart"
                }"></i>
            </button>

        </div>


        <div class="plant-card-content">

            <span class="plant-category">
                ${escapeHTML(category)}
            </span>


            <h3>
                ${escapeHTML(name)}
            </h3>


            <p class="scientific-name">
                ${escapeHTML(scientificName)}
            </p>


            <div class="plant-quick-info">

                <div class="quick-info-item">

                    <i class="bi bi-leaf"></i>

                    <span>
                        ${escapeHTML(categoryTip)}
                    </span>

                </div>

            </div>


            <button
                type="button"
                class="view-plant-btn"
            >

                View Care Guide

                <i class="bi bi-arrow-right"></i>

            </button>

        </div>

    `;


    const button =
        card.querySelector(
            ".view-plant-btn"
        );


    if (button) {

        button.addEventListener(
            "click",
            () => {

                if (!plant.id) {
                    return;
                }

                loadPlantDetails(
                    plant.id
                );

            }
        );

    }

    const favoriteButton =
    card.querySelector(
        ".favorite-btn"
    );

    if (favoriteButton) {
        favoriteButton.addEventListener(
            "click",
            async (event) => {
                event.stopPropagation();

                await toggleFavorite(
                    plant,
                    favoriteButton
                );
            }
        );
    }

    return card;

}


// ======================================================
// CATEGORY LABEL
// ======================================================

function getCategoryLabel(category) {

    const labels = {

        all: "All",
        tree: "Trees",
        flower: "Flowers",
        herb: "Herbs",
        shrub: "Shrubs",
        other: "Other"

    };


    return (
        labels[category] ||
        "Other"
    );

}


// ======================================================
// CATEGORY TIP
// ======================================================

function getCategoryTip(category) {

    const tips = {

        tree:
            "Give it enough space and suitable sunlight to grow.",

        flower:
            "Monitor sunlight and soil moisture regularly.",

        herb:
            "Check the soil before watering and provide suitable light.",

        shrub:
            "Keep the soil healthy and give the plant suitable space to grow.",

        other:
            "Check the plant's care guide for specific needs."

    };


    return (
        tips[category] ||
        tips.other
    );

}


// ======================================================
// LOAD PLANT DETAILS
// ======================================================

async function loadPlantDetails(id) {

    openModal();


    if (plantModalContent) {

        plantModalContent.innerHTML = `

            <div class="plant-loading-modal">

                <div
                    class="spinner-border"
                    role="status"
                ></div>

                <p>
                    Loading care guide...
                </p>

            </div>

        `;

    }


    try {

        const url =
            `${API_BASE}/species/details/${id}` +
            `?key=${encodeURIComponent(API_KEY)}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `Details API error: ${response.status}`
            );

        }


        const plant =
            await response.json();


        renderPlantDetails(
            plant
        );

    }

    catch (error) {

        console.error(
            "Failed to load plant details:",
            error
        );


        if (plantModalContent) {

            plantModalContent.innerHTML = `

                <div class="plant-error-content">

                    <i class="bi bi-exclamation-circle"></i>

                    <h3>
                        Unable to load care guide
                    </h3>

                    <p>
                        Please try again later.
                    </p>

                </div>

            `;

        }

    }

}


// ======================================================
// RENDER PLANT DETAILS
// ======================================================

function renderPlantDetails(plant) {

    if (!plantModalContent) {
        return;
    }


    const name =
        getPlantName(plant);


    const scientificName =
        getScientificName(plant);


    const image =
        getPlantImage(plant);


    const category =
        getCategoryLabel(
            getPlantCategory(plant)
        );


    const sunlight =
        formatValue(
            plant.sunlight
        );


    const watering =
        formatValue(
            plant.watering
        );


    const cycle =
        formatValue(
            plant.cycle
        );


    const origin =
        formatValue(
            plant.origin
        );


    const family =
        formatValue(
            plant.family
        );


    const indoor =
        plant.indoor === true
            ? "Yes"
            : plant.indoor === false
                ? "No"
                : "Unknown";


    const tips =
        generateCareTips(
            plant
        );


    plantModalContent.innerHTML = `

        <div class="plant-detail-layout">

            <div class="plant-detail-image">

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(name)}"
                    onerror="this.src='images/plant-placeholder.jpg'"
                >

            </div>


            <div class="plant-detail-info">

                <span class="plant-category">
                    ${escapeHTML(category)}
                </span>


                <h2>
                    ${escapeHTML(name)}
                </h2>


                <p class="scientific-name">
                    ${escapeHTML(scientificName)}
                </p>


                <div class="detail-grid">


                    <div class="detail-item">

                        <i class="bi bi-droplet"></i>

                        <span>
                            Watering
                        </span>

                        <strong>
                            ${escapeHTML(watering)}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <i class="bi bi-sun"></i>

                        <span>
                            Sunlight
                        </span>

                        <strong>
                            ${escapeHTML(sunlight)}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <i class="bi bi-house"></i>

                        <span>
                            Indoor
                        </span>

                        <strong>
                            ${escapeHTML(indoor)}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <i class="bi bi-arrow-repeat"></i>

                        <span>
                            Cycle
                        </span>

                        <strong>
                            ${escapeHTML(cycle)}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <i class="bi bi-diagram-3"></i>

                        <span>
                            Family
                        </span>

                        <strong>
                            ${escapeHTML(family)}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <i class="bi bi-globe"></i>

                        <span>
                            Origin
                        </span>

                        <strong>
                            ${escapeHTML(origin)}
                        </strong>

                    </div>

                </div>


                ${
                    plant.description
                        ? `

                            <div class="plant-description">

                                <h3>
                                    About this plant
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        plant.description
                                    )}
                                </p>

                            </div>

                        `
                        : ""
                }


                <div class="greenlife-care-tips">

                    <h3>

                        <i class="bi bi-leaf"></i>

                        GreenLife Care Tips

                    </h3>


                    <ul>

                        ${
                            tips
                                .map(
                                    (tip) =>
                                        `<li>${escapeHTML(tip)}</li>`
                                )
                                .join("")
                        }

                    </ul>

                </div>

            </div>

        </div>

    `;

}


// ======================================================
// GENERATE CARE TIPS
// ======================================================

function generateCareTips(plant) {

    const tips = [];


    // -----------------------------------------------
    // WATERING
    // -----------------------------------------------

    if (plant.watering) {

        tips.push(
            `Water according to its ${String(
                plant.watering
            ).toLowerCase()} watering needs.`
        );

    }

    else {

        tips.push(
            "Check the soil before watering and avoid keeping the soil constantly waterlogged."
        );

    }


    // -----------------------------------------------
    // SUNLIGHT
    // -----------------------------------------------

    if (
        Array.isArray(
            plant.sunlight
        ) &&
        plant.sunlight.length
    ) {

        tips.push(
            `Provide suitable ${plant.sunlight
                .join(", ")
                .toLowerCase()} light conditions.`
        );

    }

    else {

        tips.push(
            "Place the plant where it receives suitable natural light."
        );

    }


    // -----------------------------------------------
    // INDOOR
    // -----------------------------------------------

    if (
        plant.indoor === true
    ) {

        tips.push(
            "This plant can be grown indoors, but make sure it still receives adequate light and ventilation."
        );

    }


    // -----------------------------------------------
    // PLANT CYCLE
    // -----------------------------------------------

    if (
        plant.cycle &&
        String(
            plant.cycle
        )
            .toLowerCase()
            .includes(
                "perennial"
            )
    ) {

        tips.push(
            "As a perennial plant, it can continue growing across multiple seasons when properly cared for."
        );

    }


    // -----------------------------------------------
    // GENERAL OBSERVATION
    // -----------------------------------------------

    tips.push(
        "Monitor the leaves and soil regularly so you can respond early to signs of stress."
    );


    return tips;

}


// ======================================================
// RETRY
// ======================================================

function initializeRetry() {

    if (!retryButton) {
        return;
    }


    retryButton.addEventListener(
        "click",
        () => {

            loadPlants(
                currentApiPage
            );

        }
    );

}


// ======================================================
// UI STATES
// ======================================================

function showLoading() {

    hideEmpty();

    hideError();


    if (loadingState) {

        loadingState.hidden = false;

        loadingState.style.display =
            "flex";

    }

}


function hideLoading() {

    if (loadingState) {

        loadingState.hidden = true;

        loadingState.style.display =
            "none";

    }

}


function showEmpty() {

    hideLoading();


    if (emptyState) {

        emptyState.hidden = false;

        emptyState.style.display =
            "flex";

    }

}


function hideEmpty() {

    if (emptyState) {

        emptyState.hidden = true;

        emptyState.style.display =
            "none";

    }

}


function showError() {

    hideLoading();

    hideEmpty();


    if (errorState) {

        errorState.hidden = false;

        errorState.style.display =
            "flex";

    }

}


function hideError() {

    if (errorState) {

        errorState.hidden = true;

        errorState.style.display =
            "none";

    }

}


// ======================================================
// PLANT COUNT
// ======================================================

function updatePlantCount() {

    if (!plantCount) {
        return;
    }


    plantCount.textContent =
        plants.length.toLocaleString();

}


// ======================================================
// EXPLORER STATUS
// ======================================================

function updateExplorerStatus(
    count
) {

    if (!explorerStatus) {
        return;
    }


    if (!count) {

        explorerStatus.textContent =
            "No plants found";

        return;

    }


    explorerStatus.textContent =
        `${count} plant${
            count === 1
                ? ""
                : "s"
        } in this view`;

}


// ======================================================
// OPEN MODAL
// ======================================================

function openModal() {

    if (!plantModal) {
        return;
    }


    if (
        typeof bootstrap !==
        "undefined"
    ) {

        const modal =
            bootstrap.Modal.getOrCreateInstance(
                plantModal
            );


        modal.show();

    }

}


// ======================================================
// HELPERS
// ======================================================

function getPlantName(plant) {

    return (
        plant.common_name ||
        plant.name ||
        "Unknown Plant"
    );

}


function getScientificName(
    plant
) {

    if (
        Array.isArray(
            plant.scientific_name
        )
    ) {

        return (
            plant.scientific_name[0] ||
            "Unknown"
        );

    }


    return (
        plant.scientific_name ||
        "Unknown"
    );

}


function getPlantImage(plant) {

    return (
        plant.default_image?.regular_url ||
        plant.default_image?.medium_url ||
        plant.default_image?.original_url ||
        "images/plant-placeholder.jpg"
    );

}


function formatValue(value) {

    if (Array.isArray(value)) {

        return value.length
            ? value.join(", ")
            : "Not available";

    }


    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "Not available";

    }


    return String(value);

}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


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
// DEFAULT UI STATE
// ======================================================

function updateDonationLikeDefaults() {

    if (searchInput) {

        updateClearButton();

    }


    if (categoryFilters) {

        const activeButton =
            categoryFilters.querySelector(
                ".category-btn.active"
            );


        if (activeButton) {

            currentCategory =
                activeButton.dataset.category ||
                "all";

        }

    }


    if (sortFilter) {

        currentSort =
            sortFilter.value ||
            "default";

    }

}