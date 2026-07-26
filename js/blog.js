import {
    db,
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from "./firebase.js";

/* ======================================================
   ELEMENTS
====================================================== */

const blogTitle = document.getElementById("blogTitle");
const blogImage = document.getElementById("blogImage");
const blogContent = document.getElementById("blogContent");
const blogAuthor = document.getElementById("blogAuthor");
const blogCategory = document.getElementById("blogCategory");
const blogDate = document.getElementById("blogDate");
const readingTime = document.getElementById("readingTime");
const relatedBlogs = document.getElementById("relatedBlogs");
const copyBtn = document.getElementById("copyLinkBtn");

/* ======================================================
   GET BLOG ID
====================================================== */

const params = new URLSearchParams(window.location.search);
const blogID = params.get("id");

document.addEventListener("DOMContentLoaded", async () => {

    if (!blogID) {

        show404();

        return;

    }

    await loadBlog();

});

/* ======================================================
   LOAD BLOG
====================================================== */

async function loadBlog() {

    try {

        const ref = doc(db, "blogs", blogID);

        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {

            show404();

            return;

        }

        const blog = snapshot.data();

        renderBlog(blog);

        loadRelated(blog.category);

        initializeCopyButton();

    }

    catch (error) {

        console.error(error);

        show404();

    }

}

/* ======================================================
   RENDER BLOG
====================================================== */

function renderBlog(blog) {

    document.title = blog.title + " | GreenLife";

    blogTitle.textContent = blog.title;

    blogImage.src = blog.imageURL;

    blogImage.alt = blog.title;

    blogCategory.textContent = blog.category;

    blogAuthor.textContent = blog.author;

    blogDate.textContent =

        blog.createdAt?.toDate().toLocaleDateString() ?? "";

    const words = blog.content.split(/\s+/).length;

    readingTime.textContent =

        Math.max(1, Math.ceil(words / 200)) + " min read";

    blogContent.innerHTML = "";

    blog.content

        .split("\n\n")

        .forEach(paragraph => {

            const p = document.createElement("p");

            p.textContent = paragraph;

            blogContent.appendChild(p);

        });

}

/* ======================================================
   RELATED POSTS
====================================================== */

async function loadRelated(category) {

    const q = query(

        collection(db, "blogs"),

        where("status", "==", "published"),

        where("category", "==", category),

        orderBy("createdAt", "desc"),

        limit(4)

    );

    const snapshot = await getDocs(q);

    relatedBlogs.innerHTML = "";

    snapshot.forEach(docSnap => {

        if (docSnap.id === blogID) return;

        const blog = docSnap.data();

        relatedBlogs.innerHTML += `

        <article class="related-card">

            <img src="${blog.imageURL}" alt="${blog.title}">

            <div class="related-content">

                <h3>${blog.title}</h3>

                <a href="blog.html?id=${docSnap.id}">

                    Read More

                    <i class="bi bi-arrow-right"></i>

                </a>

            </div>

        </article>

        `;

    });

}

/* ======================================================
   COPY LINK
====================================================== */

function initializeCopyButton() {

    if (!copyBtn) return;

    copyBtn.addEventListener("click", async () => {

        await navigator.clipboard.writeText(window.location.href);

        const original = copyBtn.innerHTML;

        copyBtn.innerHTML = `

            <i class="bi bi-check-circle"></i>

            Link Copied

        `;

        setTimeout(() => {

            copyBtn.innerHTML = original;

        }, 2000);

    });

}

/* ======================================================
   404
====================================================== */

function show404() {

    document.querySelector(".page-wrapper").innerHTML = `

    <section style="padding:120px;text-align:center;">

        <h1>

            404

        </h1>

        <h3>

            Article Not Found

        </h3>

        <p>

            The article you're looking for doesn't exist
            or has been removed.

        </p>

        <a
            href="index.html"
            class="primary-btn">

            Back Home

        </a>

    </section>

    `;

}