import {
    db,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from "./firebase.js";

/* ======================================================
   GLOBALS
====================================================== */

const blogGrid = document.getElementById("blogGrid");
const searchInput = document.getElementById("searchBlog");
const categoryFilter = document.getElementById("categoryFilter");

let blogs = [];
let filteredBlogs = [];

/* ======================================================
   INITIALIZE
====================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    await loadBlogs();

    initializeSearch();

    initializeCategoryFilter();

    animateCounters();

    revealOnScroll();

});

/* ======================================================
   LOAD BLOGS
====================================================== */

async function loadBlogs() {

    try {

        const q = query(

            collection(db, "blogs"),

            where("status", "==", "published"),

            orderBy("createdAt", "desc"),

            limit(9)

        );

        const snapshot = await getDocs(q);

        blogs = snapshot.docs.map(doc => ({

            id: doc.id,

            ...doc.data()

        }));

        filteredBlogs = [...blogs];

        renderBlogs(filteredBlogs);

    }

    catch (error) {

        console.error(error);

        blogGrid.innerHTML = `

            <div class="empty-state">

                <i class="bi bi-journal-x"></i>

                <h3>No articles available.</h3>

            </div>

        `;

    }

}

/* ======================================================
   RENDER BLOGS
====================================================== */

function renderBlogs(data) {

    if (data.length === 0) {

        blogGrid.innerHTML = `

            <div class="empty-state">

                <i class="bi bi-search"></i>

                <h3>No matching articles found.</h3>

            </div>

        `;

        return;

    }

    blogGrid.innerHTML = "";

    data.forEach(blog => {

        const date = blog.createdAt?.toDate
            ? blog.createdAt.toDate().toLocaleDateString()
            : "";

        blogGrid.innerHTML += `

        <article class="blog-card">

            <img src="${blog.imageURL}" alt="${blog.title}">

            <div class="blog-content">

                <span class="blog-category">

                    ${blog.category}

                </span>

                <h3>

                    ${blog.title}

                </h3>

                <p>

                    ${blog.summary}

                </p>

                <div class="blog-meta">

                    <span>

                        ${blog.author}

                    </span>

                    <span>

                        ${date}

                    </span>

                </div>

                <a href="blog.html?id=${blog.id}" class="read-more">

                    Read More

                    <i class="bi bi-arrow-right"></i>

                </a>

            </div>

        </article>

        `;

    });

}

/* ======================================================
   SEARCH
====================================================== */

function initializeSearch() {

    if (!searchInput) return;

    searchInput.addEventListener("input", () => {

        const keyword = searchInput.value.toLowerCase();

        filteredBlogs = blogs.filter(blog =>

            blog.title.toLowerCase().includes(keyword) ||

            blog.summary.toLowerCase().includes(keyword)

        );

        applyCategory();

    });

}

/* ======================================================
   CATEGORY FILTER
====================================================== */

function initializeCategoryFilter() {

    if (!categoryFilter) return;

    categoryFilter.addEventListener("change", applyCategory);

}

function applyCategory() {

    const keyword = searchInput.value.toLowerCase();

    const category = categoryFilter.value;

    let result = blogs.filter(blog =>

        blog.title.toLowerCase().includes(keyword) ||

        blog.summary.toLowerCase().includes(keyword)

    );

    if (category !== "all") {

        result = result.filter(

            blog => blog.category === category

        );

    }

    renderBlogs(result);

}

/* ======================================================
   COUNTER
====================================================== */

function animateCounters() {

    const counters = document.querySelectorAll(".hero-stats h2");

    counters.forEach(counter => {

        const target = parseInt(

            counter.innerText.replace(/\D/g, "")

        );

        let value = 0;

        const speed = target / 60;

        const update = () => {

            value += speed;

            if (value < target) {

                counter.innerText = Math.floor(value) + "+";

                requestAnimationFrame(update);

            }

            else {

                counter.innerText = target + "+";

            }

        };

        update();

    });

}

/* ======================================================
   SCROLL REVEAL
====================================================== */

function revealOnScroll() {

    const elements = document.querySelectorAll(

        ".feature-card,.tip-card,.blog-card,.gallery-item,.support-card"

    );

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    }, {

        threshold:0.15

    });

    elements.forEach(el => {

        el.classList.add("hidden");

        observer.observe(el);

    });

}