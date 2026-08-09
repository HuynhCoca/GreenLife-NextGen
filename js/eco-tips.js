/* ======================================================
   ECO TIPS — GREENLIFE + PERENUAL
====================================================== */

const API_KEY = "sk-ro4W6a782c7a3598419236";

const API_BASE = "https://www.perenual.com/api/v2";


/* ======================================================
   DOM ELEMENTS
====================================================== */

const plantGrid = document.getElementById("plantGrid");

const searchInput = document.getElementById("plantSearch");
const clearSearch = document.getElementById("clearSearch");

const categoryFilter =
    document.getElementById("plantCategory");

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


/* ======================================================
   STATE
====================================================== */

let plants = [];

let currentSearch = "";

let currentCategory = "all";

let currentSort = "default";

let currentPage = 1;

const PLANTS_PER_PAGE = 9;

let totalPages = 1;

/* ======================================================
   INITIALIZE
====================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeSearch();

    initializeFilters();

    initializeRetry();

    loadPlants();

});


/* ======================================================
   LOAD PLANTS FROM PERENUAL
====================================================== */

async function loadPlants(
    search = "",
    page = 1
) {

    showLoading();

    currentPage = page;

    try {

        let url =
            `${API_BASE}/species-list` +
            `?key=${API_KEY}` +
            `&page=${page}`;


        /*
           Search is optional.
        */

        if (search) {

            url +=
                `&q=${encodeURIComponent(search)}`;

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


        /*
           Only keep the plants returned
           for THIS page.
        */

        plants =
            Array.isArray(result.data)
                ? result.data
                : [];


        /*
           Get pagination information
           from Perenual.
        */

        const total =
            result.total ||
            result.to ||
            plants.length;


        totalPages =
            Math.max(
                1,
                Math.ceil(
                    total / PLANTS_PER_PAGE
                )
            );


        /*
           Add GreenLife category.
        */

        plants =
            plants.map(plant => ({

                ...plant,

                greenlifeCategory:
                    getPlantCategory(plant)

            }));


        /*
           Get detailed information ONLY
           for these 9 plants.
        */



        applyFilters();


        renderPagination();

    }

    catch (error) {

        console.error(
            "Failed to load plants:",
            error
        );

        showError();

    }

}


/* ======================================================
   SEARCH
====================================================== */

function initializeSearch() {

    if (!searchInput) return;


    /*
       Search ONLY when Enter is pressed.
       This prevents unnecessary API calls.
    */

    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Enter") {
                return;
            }


            event.preventDefault();


            const keyword =
                searchInput.value.trim();


            currentSearch = keyword;


            loadPlants(keyword, 1);

        }
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

                loadPlants("", 1);

            }
        );

    }

}


/* ======================================================
   FILTERS
====================================================== */

function initializeFilters() {

    /* ================================================
       CATEGORY BUTTONS
    ================================================ */

    const categoryFilters =
        document.getElementById("categoryFilters");

    if (categoryFilters) {

        const buttons =
            categoryFilters.querySelectorAll(
                ".category-btn"
            );

        buttons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    /* Remove active from every button */

                    buttons.forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                    /* Activate clicked button */

                    button.classList.add(
                        "active"
                    );


                    /* Get category from data-category */

                    currentCategory =
                        button.dataset.category ||
                        "all";


                    /* Apply filter */

                    applyFilters();

                }
            );

        });

    }


    /* ================================================
       SORT DROPDOWN
    ================================================ */

    if (sortFilter) {

        sortFilter.addEventListener(
            "change",
            () => {

                currentSort =
                    sortFilter.value;

                applyFilters();

            }
        );

    }

}


/* ======================================================
   GREENLIFE CATEGORY SYSTEM
====================================================== */

function getPlantCategory(plant) {

    const name =
        getSearchablePlantText(plant);


    /* HOUSEPLANTS → we'll treat indoor plants
       as "shrub" for now only if your UI doesn't
       have a houseplant button. */

    if (plant.indoor === true) {

        return "shrub";

    }


    /* SUCCULENTS */

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
            name,
            succulentKeywords
        )
    ) {

        return "shrub";

    }


    /* HERBS */

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
            name,
            herbKeywords
        )
    ) {

        return "herb";

    }


    /* FLOWERS */

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
            name,
            flowerKeywords
        )
    ) {

        return "flower";

    }


    /* TREES */

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
            name,
            treeKeywords
        )
    ) {

        return "tree";

    }


    /* Default */

    return "other";

}


/* ======================================================
   SEARCHABLE PLANT TEXT
====================================================== */

function getSearchablePlantText(plant) {

    const commonName =
        plant.common_name || "";


    const scientificName =
        Array.isArray(
            plant.scientific_name
        )
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


/* ======================================================
   KEYWORD CHECK
====================================================== */

function containsKeyword(
    text,
    keywords
) {

    return keywords.some(
        keyword =>
            text.includes(
                keyword.toLowerCase()
            )
    );

}


/* ======================================================
   APPLY LOCAL FILTERS
====================================================== */

function applyFilters() {

    let result = [...plants];


    /* ================================================
       CATEGORY FILTER
    ================================================ */

    if (
        currentCategory &&
        currentCategory !== "all"
    ) {

        result = result.filter(
            plant =>
                plant.greenlifeCategory ===
                currentCategory
        );

    }


    /* ================================================
       SORT
    ================================================ */

    if (currentSort === "name") {

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


    renderPlants(result);

}

/* ======================================================
   RENDER PLANTS
====================================================== */

function renderPlants(data) {

    hideLoading();

    hideError();


    if (!plantGrid) {
        return;
    }


    plantGrid.innerHTML = "";


    if (!data.length) {

        showEmpty();

        return;

    }


    hideEmpty();


    data.forEach(plant => {

        const card =
            createPlantCard(plant);


        plantGrid.appendChild(card);

    });

}

function renderPagination() {

    const pagination =
        document.getElementById(
            "plantPagination"
        );


    if (!pagination) {
        return;
    }


    pagination.innerHTML = "";


    /*
       Don't show pagination when
       there is only one page.
    */

    if (totalPages <= 1) {

        return;

    }


    /* ================================================
       PREVIOUS BUTTON
    ================================================ */

    const previousButton =
        document.createElement("button");


    previousButton.className =
        "pagination-btn";


    previousButton.innerHTML =
        `<i class="bi bi-chevron-left"></i>`;


    previousButton.disabled =
        currentPage === 1;


    previousButton.addEventListener(
        "click",
        () => {

            if (currentPage > 1) {

                loadPlants(
                    currentSearch,
                    currentPage - 1
                );

            }

        }
    );


    pagination.appendChild(
        previousButton
    );


    /* ================================================
       PAGE NUMBERS
    ================================================ */

    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const pageButton =
            document.createElement("button");


        pageButton.className =
            "pagination-btn";


        pageButton.textContent =
            page;


        if (page === currentPage) {

            pageButton.classList.add(
                "active"
            );

        }


        pageButton.addEventListener(
            "click",
            () => {

                if (
                    page !== currentPage
                ) {

                    loadPlants(
                        currentSearch,
                        page
                    );

                }

            }
        );


        pagination.appendChild(
            pageButton
        );

    }


    /* ================================================
       NEXT BUTTON
    ================================================ */

    const nextButton =
        document.createElement("button");


    nextButton.className =
        "pagination-btn";


    nextButton.innerHTML =
        `<i class="bi bi-chevron-right"></i>`;


    nextButton.disabled =
        currentPage === totalPages;


    nextButton.addEventListener(
        "click",
        () => {

            if (
                currentPage < totalPages
            ) {

                loadPlants(
                    currentSearch,
                    currentPage + 1
                );

            }

        }
    );


    pagination.appendChild(
        nextButton
    );

}
/* ======================================================
   CREATE PLANT CARD
====================================================== */

function createPlantCard(plant) {

    const card =
        document.createElement("article");


    card.className = "plant-card";


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
        getCategoryTip(category);


    card.innerHTML = `

        <div class="plant-image-wrapper">

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
                loading="lazy"
            >

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


    button.addEventListener(
        "click",
        () => {

            loadPlantDetails(
                plant.id
            );

        }
    );


    return card;

}


/* ======================================================
   LOAD PLANT DETAILS
====================================================== */

async function loadPlantDetails(id) {

    try {

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


        openModal();


        const url =
            `${API_BASE}/species/details/${id}?key=${API_KEY}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `Details API error: ${response.status}`
            );

        }


        const plant =
            await response.json();


        renderPlantDetails(plant);

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


/* ======================================================
   RENDER CARE GUIDE
====================================================== */

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
        plant.watering ||
        "Not available";


    const cycle =
        plant.cycle ||
        "Not available";


    const origin =
        formatValue(
            plant.origin
        );


    const family =
        plant.family ||
        "Not available";


    const indoor =
        plant.indoor === true
            ? "Yes"
            : plant.indoor === false
                ? "No"
                : "Unknown";


    const tips =
        generateCareTips(plant);


    plantModalContent.innerHTML = `

        <div class="plant-detail-layout">


            <div class="plant-detail-image">

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(name)}"
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

                        <span>Watering</span>

                        <strong>
                            ${escapeHTML(watering)}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <i class="bi bi-sun"></i>

                        <span>Sunlight</span>

                        <strong>
                            ${escapeHTML(sunlight)}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <i class="bi bi-house"></i>

                        <span>Indoor</span>

                        <strong>
                            ${indoor}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <i class="bi bi-arrow-repeat"></i>

                        <span>Cycle</span>

                        <strong>
                            ${escapeHTML(cycle)}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <i class="bi bi-diagram-3"></i>

                        <span>Family</span>

                        <strong>
                            ${escapeHTML(family)}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <i class="bi bi-globe"></i>

                        <span>Origin</span>

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

                        ${tips
                            .map(
                                tip =>
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


/* ======================================================
   GENERATE CARE TIPS
====================================================== */

function generateCareTips(plant) {

    const tips = [];


    /*
       Watering
    */

    if (plant.watering) {

        tips.push(
            `Water according to its ${plant.watering.toLowerCase()} watering needs.`
        );

    }

    else {

        tips.push(
            "Check the soil before watering and avoid keeping the soil constantly waterlogged."
        );

    }


    /*
       Sunlight
    */

    if (
        Array.isArray(
            plant.sunlight
        ) &&
        plant.sunlight.length
    ) {

        tips.push(
            `Provide suitable ${plant.sunlight.join(", ").toLowerCase()} conditions.`
        );

    }

    else {

        tips.push(
            "Place the plant where it receives suitable natural light."
        );

    }


    /*
       Indoor plants
    */

    if (plant.indoor === true) {

        tips.push(
            "This plant can be grown indoors, but make sure it still receives adequate light and ventilation."
        );

    }


    /*
       Cycle
    */

    if (
        plant.cycle &&
        plant.cycle.toLowerCase()
            .includes("perennial")
    ) {

        tips.push(
            "As a perennial plant, it can continue growing across multiple seasons when properly cared for."
        );

    }


    /*
       General tip
    */

    tips.push(
        "Monitor the leaves and soil regularly so you can respond early to signs of stress."
    );


    return tips;

}


/* ======================================================
   CATEGORY LABEL
====================================================== */

function getCategoryLabel(category) {

    const labels = {

        all: "All Plants",

        trees: "Trees",

        flowers: "Flowers",

        herbs: "Herbs",

        houseplants: "Houseplants",

        succulents: "Succulents",

        other: "Other"

    };


    return (
        labels[category] ||
        "Plant"
    );

}


/* ======================================================
   MODAL
====================================================== */

function openModal() {

    if (!plantModal) {
        return;
    }


    if (
        typeof bootstrap !== "undefined"
    ) {

        const modal =
            bootstrap.Modal.getOrCreateInstance(
                plantModal
            );


        modal.show();


        return;

    }


    plantModal.style.display =
        "block";


    plantModal.classList.add(
        "show"
    );

}


function closeModal() {

    if (!plantModal) {
        return;
    }


    if (
        typeof bootstrap !== "undefined"
    ) {

        const modal =
            bootstrap.Modal.getInstance(
                plantModal
            );


        if (modal) {
            modal.hide();
        }


        return;

    }


    plantModal.style.display =
        "none";


    plantModal.classList.remove(
        "show"
    );

}


/* ======================================================
   RETRY
====================================================== */

function initializeRetry() {

    if (!retryButton) {
        return;
    }


    retryButton.addEventListener(
        "click",
        () => {

            loadPlants(
                currentSearch
            );

        }
    );

}


/* ======================================================
   UI STATES
====================================================== */

function showLoading() {

    hideEmpty();

    hideError();


    if (loadingState) {

        loadingState.style.display =
            "block";

    }

}


function hideLoading() {

    if (loadingState) {

        loadingState.style.display =
            "none";

    }

}


function showEmpty() {

    hideLoading();


    if (emptyState) {

        emptyState.style.display =
            "block";

    }

}


function hideEmpty() {

    if (emptyState) {

        emptyState.style.display =
            "none";

    }

}


function showError() {

    hideLoading();

    hideEmpty();


    if (errorState) {

        errorState.style.display =
            "block";

    }

}


function hideError() {

    if (errorState) {

        errorState.style.display =
            "none";

    }

}


/* ======================================================
   HELPERS
====================================================== */

function getPlantName(plant) {

    return (
        plant.common_name ||
        plant.name ||
        "Unknown Plant"
    );

}


function getScientificName(plant) {

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

        return value.join(", ");

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