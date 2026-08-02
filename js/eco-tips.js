// ======================================================
// ECO TIPS — PlantSolve Plant Encyclopedia
// ======================================================

const PLANTS_INDEX_URL =
    "https://www.plantsolve.com/api/v1/plants/index.json";

const PLANTS_API_URL =
    "https://www.plantsolve.com/api/v1/plants";


// ======================================================
// DOM
// ======================================================

const plantGrid = document.getElementById("plantGrid");
const plantSearch = document.getElementById("plantSearch");
const clearSearch = document.getElementById("clearSearch");
const categoryFilters =
    document.getElementById("categoryFilters");
const plantSort = document.getElementById("plantSort");

const plantLoading =
    document.getElementById("plantLoading");

const plantError =
    document.getElementById("plantError");

const plantEmpty =
    document.getElementById("plantEmpty");

const retryPlants =
    document.getElementById("retryPlants");

const plantCount =
    document.getElementById("plantCount");

const plantModal =
    document.getElementById("plantModal");

const plantModalContent =
    document.getElementById("plantModalContent");


// ======================================================
// STATE
// ======================================================

let plants = [];
let filteredPlants = [];
let activeCategory = "all";


// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    setupSearch();

    setupCategories();

    setupSorting();

    setupRetry();

    loadPlants();

});


// ======================================================
// LOAD PLANT INDEX
// ======================================================

async function loadPlants() {

    showLoading();

    try {

        const response =
            await fetch(PLANTS_INDEX_URL);


        if (!response.ok) {

            throw new Error(
                `PlantSolve returned ${response.status}`
            );

        }


        const data =
            await response.json();


        plants =
            normalizePlantIndex(data);


        filteredPlants =
            [...plants];


        if (plantCount) {

            plantCount.textContent =
                plants.length;

        }


        renderPlants();

        hideLoading();

    }

    catch (error) {

        console.error(
            "PlantSolve error:",
            error
        );

        showError();

    }

}


// ======================================================
// NORMALIZE PLANT INDEX
// ======================================================

function normalizePlantIndex(data) {

    /*
     * PlantSolve's index is used only for
     * discovering plants.
     *
     * We keep this conversion isolated so
     * changes to the API format don't affect
     * the rest of the application.
     */

    const source =
        Array.isArray(data)
            ? data
            : data.plants ||
              data.results ||
              data.data ||
              [];


    return source.map((plant, index) => {

        return {

            id:
                plant.id ||
                plant.slug ||
                plant.name ||
                `plant-${index}`,

            slug:
                plant.slug ||
                createSlug(
                    plant.name ||
                    plant.commonName ||
                    `plant-${index}`
                ),

            name:
                plant.name ||
                plant.commonName ||
                plant.common_name ||
                "Unknown plant",

            scientificName:
                plant.scientificName ||
                plant.scientific_name ||
                plant.scientific ||
                "",

            image:
                plant.image ||
                plant.imageUrl ||
                plant.imageURL ||
                plant.photo ||
                "",

            category:
                normalizeCategory(
                    plant.category ||
                    plant.type ||
                    plant.plantType
                ),

            description:
                plant.description ||
                plant.summary ||
                ""

        };

    });

}


// ======================================================
// LOAD INDIVIDUAL PLANT
// ======================================================

async function loadPlantDetails(slug) {

    try {

        const response =
            await fetch(
                `${PLANTS_API_URL}/${encodeURIComponent(slug)}.json`
            );


        if (!response.ok) {

            throw new Error(
                `PlantSolve returned ${response.status}`
            );

        }


        const data =
            await response.json();


        openPlantDetails(
            normalizePlantDetails(data)
        );

    }

    catch (error) {

        console.error(
            "Unable to load plant details:",
            error
        );

        plantModalContent.innerHTML = `

            <div class="plant-state">

                <div class="state-icon">

                    <i class="bi bi-cloud-slash"></i>

                </div>

                <h3>
                    Plant information unavailable
                </h3>

                <p>
                    We couldn't load the details
                    for this plant right now.
                </p>

            </div>

        `;


        showModal();

    }

}


// ======================================================
// NORMALIZE DETAILS
// ======================================================

function normalizePlantDetails(data) {

    /*
     * Keep the API-specific mapping here.
     */

    const plant =
        data.plant ||
        data.data ||
        data;


    return {

        name:
            plant.name ||
            plant.commonName ||
            plant.common_name ||
            "Unknown plant",

        scientificName:
            plant.scientificName ||
            plant.scientific_name ||
            plant.scientific ||
            "",

        image:
            plant.image ||
            plant.imageUrl ||
            plant.imageURL ||
            plant.photo ||
            "",

        category:
            normalizeCategory(
                plant.category ||
                plant.type ||
                plant.plantType
            ),

        description:
            plant.description ||
            plant.summary ||
            plant.about ||
            "No description available.",

        family:
            plant.family ||
            "Not available",

        origin:
            plant.origin ||
            plant.nativeRegion ||
            plant.native_region ||
            "Not available",

        growth:
            plant.growth ||
            plant.growthHabit ||
            plant.growth_habit ||
            "Not available",

        sunlight:
            plant.sunlight ||
            plant.light ||
            "Not available",

        water:
            plant.water ||
            plant.waterNeeds ||
            plant.water_needs ||
            "Not available"

    };

}


// ======================================================
// RENDER PLANTS
// ======================================================

function renderPlants() {

    hideStates();


    if (!filteredPlants.length) {

        plantEmpty.hidden = false;

        return;

    }


    plantGrid.innerHTML = "";


    filteredPlants.forEach(plant => {

        plantGrid.appendChild(
            createPlantCard(plant)
        );

    });

}


// ======================================================
// CREATE CARD
// ======================================================

function createPlantCard(plant) {

    const article =
        document.createElement("article");


    article.className =
        "plant-card";


    article.innerHTML = `

        <div class="plant-card-image">

            ${
                plant.image

                ? `
                    <img
                        src="${escapeHTML(plant.image)}"
                        alt="${escapeHTML(plant.name)}"
                        loading="lazy"
                    >
                `

                : `
                    <div class="plant-image-placeholder">

                        <i class="bi bi-tree"></i>

                    </div>
                `
            }

            <span class="plant-category">

                ${formatCategory(plant.category)}

            </span>

        </div>


        <div class="plant-card-content">

            <h3>
                ${escapeHTML(plant.name)}
            </h3>


            ${
                plant.scientificName

                ? `
                    <p class="plant-scientific-name">

                        ${escapeHTML(
                            plant.scientificName
                        )}

                    </p>
                `

                : ""
            }


            ${
                plant.description

                ? `
                    <p class="plant-card-description">

                        ${escapeHTML(
                            plant.description
                        )}

                    </p>
                `

                : `
                    <p class="plant-card-description">

                        Explore this plant to learn
                        more about it.

                    </p>
                `
            }


            <div class="plant-card-footer">

                <span class="plant-type">

                    <i class="bi bi-leaf"></i>

                    ${formatCategory(
                        plant.category
                    )}

                </span>


                <button
                    type="button"
                    class="plant-view-btn"
                >

                    View Details

                    <i class="bi bi-arrow-right"></i>

                </button>

            </div>

        </div>

    `;


    const button =
        article.querySelector(
            ".plant-view-btn"
        );


    button.addEventListener(
        "click",
        () => {

            loadPlantDetails(
                plant.slug
            );

        }
    );


    return article;

}


// ======================================================
// PLANT DETAILS MODAL
// ======================================================

function openPlantDetails(plant) {

    plantModalContent.innerHTML = `

        <div class="plant-detail">

            <div class="plant-detail-image">

                ${
                    plant.image

                    ? `
                        <img
                            src="${escapeHTML(
                                plant.image
                            )}"
                            alt="${escapeHTML(
                                plant.name
                            )}"
                        >
                    `

                    : `
                        <div
                            class="plant-image-placeholder"
                        >

                            <i class="bi bi-tree"></i>

                        </div>
                    `
                }

            </div>


            <div class="plant-detail-content">

                <span class="plant-detail-category">

                    ${formatCategory(
                        plant.category
                    )}

                </span>


                <h2 id="plantModalLabel">

                    ${escapeHTML(
                        plant.name
                    )}

                </h2>


                ${
                    plant.scientificName

                    ? `
                        <p
                            class="plant-detail-scientific"
                        >

                            ${escapeHTML(
                                plant.scientificName
                            )}

                        </p>
                    `

                    : ""
                }


                <p class="plant-detail-description">

                    ${escapeHTML(
                        plant.description
                    )}

                </p>


                <div class="plant-detail-facts">

                    ${createFact(
                        "Family",
                        plant.family
                    )}

                    ${createFact(
                        "Origin",
                        plant.origin
                    )}

                    ${createFact(
                        "Growth",
                        plant.growth
                    )}

                    ${createFact(
                        "Sunlight",
                        plant.sunlight
                    )}

                    ${createFact(
                        "Water",
                        plant.water
                    )}

                </div>

            </div>

        </div>


        <div class="plantsolve-credit">

            Plant information provided by
            <a
                href="https://www.plantsolve.com/"
                target="_blank"
                rel="noopener noreferrer"
            >
                PlantSolve
            </a>

        </div>

    `;


    showModal();

}


// ======================================================
// FACT
// ======================================================

function createFact(label, value) {

    if (!value) {
        return "";
    }


    return `

        <div class="plant-fact">

            <span>
                ${escapeHTML(label)}
            </span>

            <strong>
                ${escapeHTML(value)}
            </strong>

        </div>

    `;

}


// ======================================================
// SHOW MODAL
// ======================================================

function showModal() {

    if (
        typeof bootstrap === "undefined" ||
        !bootstrap.Modal
    ) {

        console.error(
            "Bootstrap Modal is unavailable."
        );

        return;

    }


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            plantModal
        );


    modal.show();

}


// ======================================================
// SEARCH
// ======================================================

function setupSearch() {

    if (!plantSearch) {
        return;
    }


    plantSearch.addEventListener(
        "input",
        () => {

            const keyword =
                plantSearch.value
                    .trim()
                    .toLowerCase();


            if (clearSearch) {

                clearSearch.classList.toggle(
                    "visible",
                    keyword.length > 0
                );

            }


            applyFilters();

        }
    );


    clearSearch?.addEventListener(
        "click",
        () => {

            plantSearch.value = "";

            clearSearch.classList.remove(
                "visible"
            );

            applyFilters();

            plantSearch.focus();

        }
    );

}


// ======================================================
// CATEGORY
// ======================================================

function setupCategories() {

    if (!categoryFilters) {
        return;
    }


    const buttons =
        categoryFilters.querySelectorAll(
            ".category-btn"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                buttons.forEach(btn =>
                    btn.classList.remove(
                        "active"
                    )
                );


                button.classList.add(
                    "active"
                );


                activeCategory =
                    button.dataset.category ||
                    "all";


                applyFilters();

            }
        );

    });

}


// ======================================================
// SORT
// ======================================================

function setupSorting() {

    plantSort?.addEventListener(
        "change",
        applyFilters
    );

}


// ======================================================
// FILTER
// ======================================================

function applyFilters() {

    const keyword =
        plantSearch
            ? plantSearch.value
                .trim()
                .toLowerCase()
            : "";


    filteredPlants =
        plants.filter(plant => {

            const searchableText = `

                ${plant.name}

                ${plant.scientificName}

                ${plant.description}

            `.toLowerCase();


            const matchesSearch =
                !keyword ||
                searchableText.includes(keyword);


            const matchesCategory =
                activeCategory === "all" ||
                plant.category === activeCategory;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    sortPlants();

    renderPlants();

}


// ======================================================
// SORT
// ======================================================

function sortPlants() {

    const sort =
        plantSort?.value;


    if (sort === "name-asc") {

        filteredPlants.sort(
            (a, b) =>
                a.name.localeCompare(b.name)
        );

    }


    if (sort === "name-desc") {

        filteredPlants.sort(
            (a, b) =>
                b.name.localeCompare(a.name)
        );

    }

}


// ======================================================
// RETRY
// ======================================================

function setupRetry() {

    retryPlants?.addEventListener(
        "click",
        loadPlants
    );

}


// ======================================================
// STATES
// ======================================================

function showLoading() {

    plantLoading.hidden = false;

    plantError.hidden = true;

    plantEmpty.hidden = true;

    plantGrid.innerHTML = "";

}


function hideLoading() {

    plantLoading.hidden = true;

}


function showError() {

    plantLoading.hidden = true;

    plantEmpty.hidden = true;

    plantError.hidden = false;

}


function hideStates() {

    plantLoading.hidden = true;

    plantError.hidden = true;

    plantEmpty.hidden = true;

}


// ======================================================
// CATEGORY FORMAT
// ======================================================

function normalizeCategory(category) {

    if (!category) {
        return "other";
    }


    const value =
        String(category)
            .toLowerCase()
            .trim();


    if (value.includes("tree")) {
        return "tree";
    }

    if (value.includes("flower")) {
        return "flower";
    }

    if (value.includes("herb")) {
        return "herb";
    }

    if (value.includes("shrub")) {
        return "shrub";
    }


    return "other";

}


function formatCategory(category) {

    if (!category) {
        return "Plant";
    }


    return (
        category.charAt(0).toUpperCase() +
        category.slice(1)
    );

}


// ======================================================
// SLUG
// ======================================================

function createSlug(value) {

    return String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}