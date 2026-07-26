/* ======================================================
   IMPORTS
====================================================== */

import {

    db,

    collection,
    doc,

    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,

    query,
    orderBy,

    serverTimestamp

} from "./firebase.js";

import {

    requireAdmin,
    getCurrentUser

} from "./authGuard.js";

/* ======================================================
   GLOBAL VARIABLES
====================================================== */

let blogs = [];

let editing = false;

let selectedBlogID = null;

/* ======================================================
   DOM ELEMENTS
====================================================== */

const userInfo =
    document.getElementById("userInfo");

const loadingOverlay =
    document.getElementById("loadingOverlay");

// Statistics

const totalBlogs =
    document.getElementById("totalBlogs");

const draftBlogs =
    document.getElementById("draftBlogs");

const totalUsers =
    document.getElementById("totalUsers");

const totalCategories =
    document.getElementById("totalCategories");

// Table

const blogTableBody =
    document.getElementById("blogTableBody");

// Buttons

const newBlogBtn =
    document.getElementById("newBlogBtn");

const refreshBtn =
    document.getElementById("refreshBtn");

const saveBlogBtn =
    document.getElementById("saveBlogBtn");

const confirmDeleteBtn =
    document.getElementById("confirmDeleteBtn");

// Search

const searchInput =
    document.getElementById("searchInput");

// Form

const blogForm =
    document.getElementById("blogForm");

const blogIdInput =
    document.getElementById("blogId");

const blogTitleInput =
    document.getElementById("blogTitleInput");

const blogSummaryInput =
    document.getElementById("blogSummaryInput");

const blogContentInput =
    document.getElementById("blogContentInput");

const blogCategoryInput =
    document.getElementById("blogCategoryInput");

const blogImageInput =
    document.getElementById("blogImageInput");

const blogAuthorInput =
    document.getElementById("blogAuthorInput");

const blogStatusInput =
    document.getElementById("blogStatusInput");

const modalTitle =
    document.getElementById("modalTitle");

/* ======================================================
   MODALS
====================================================== */

const blogModal = new bootstrap.Modal(

    document.getElementById("blogModal")

);

const deleteModal = new bootstrap.Modal(

    document.getElementById("deleteModal")

);

/* ======================================================
   INITIALIZE
====================================================== */

document.addEventListener(

    "DOMContentLoaded",

    initializeDashboard

);

async function initializeDashboard(){

    showLoading();

    try{

        const {

            profile

        }

        =

        await requireAdmin();

        if(!profile) return;

        userInfo.innerHTML = `

            <i class="bi bi-person-circle"></i>

            <span>${profile.name}</span>

        `;

        await Promise.all([

            loadStatistics(),

            loadBlogs()

        ]);

        registerEvents();

    }

    catch(error){

        console.error(error);

    }

    finally{

        hideLoading();

    }

}

/* ======================================================
   EVENTS
====================================================== */

function registerEvents(){

    newBlogBtn.addEventListener(

        "click",

        openCreateModal

    );

    refreshBtn.addEventListener(

        "click",

        refreshDashboard

    );

    saveBlogBtn.addEventListener(

        "click",

        saveBlog

    );

    confirmDeleteBtn.addEventListener(

        "click",

        deleteSelectedBlog

    );

    searchInput.addEventListener(

        "input",

        filterBlogs

    );

}

/* ======================================================
   LOADING
====================================================== */

function showLoading(){

    loadingOverlay.classList.remove(

        "d-none"

    );

}

function hideLoading(){

    loadingOverlay.classList.add(

        "d-none"

    );

}

/* ======================================================
   REFRESH
====================================================== */

async function refreshDashboard(){

    showLoading();

    await Promise.all([

        loadStatistics(),

        loadBlogs()

    ]);

    hideLoading();

}

/* ======================================================
   LOAD STATISTICS
====================================================== */

async function loadStatistics() {

    try {

        const blogSnapshot = await getDocs(

            collection(db, "blogs")

        );

        const userSnapshot = await getDocs(

            collection(db, "accounts")

        );

        const blogsData = blogSnapshot.docs.map(doc => doc.data());

        totalBlogs.textContent = blogsData.length;

        draftBlogs.textContent = blogsData.filter(

            blog => blog.status === "draft"

        ).length;

        totalUsers.textContent = userSnapshot.size;

        const categories = new Set(

            blogsData.map(blog => blog.category)

        );

        totalCategories.textContent = categories.size;

    }

    catch(error){

        console.error(error);

    }

}

/* ======================================================
   LOAD BLOGS
====================================================== */

async function loadBlogs(){

    try{

        const q = query(

            collection(db,"blogs"),

            orderBy(

                "createdAt",

                "desc"

            )

        );

        const snapshot = await getDocs(q);

        blogs = snapshot.docs.map(doc => ({

            id:doc.id,

            ...doc.data()

        }));

        renderBlogTable(blogs);

    }

    catch(error){

        console.error(error);

    }

}

/* ======================================================
   RENDER TABLE
====================================================== */

function renderBlogTable(data){

    if(data.length===0){

        blogTableBody.innerHTML=`

        <tr>

            <td colspan="6">

                <div class="empty-state">

                    <i class="bi bi-journal-x"></i>

                    <h3>No blogs yet</h3>

                    <p>Create your first article.</p>

                </div>

            </td>

        </tr>

        `;

        return;

    }

    let html="";

    data.forEach(blog=>{

        html+=`

        <tr>

            <td>

                <img

                    src="${blog.imageURL}"

                    class="table-image"

                    alt="${blog.title}"

                >

            </td>

            <td>

                ${blog.title}

            </td>

            <td>

                ${blog.category}

            </td>

            <td>

                <span class="status ${blog.status}">

                    ${blog.status}

                </span>

            </td>

            <td>

                ${formatDate(

                    blog.createdAt

                )}

            </td>

            <td>

                <div class="action-buttons">

                    <button

                        class="btn btn-sm btn-success edit-btn"

                        data-id="${blog.id}"

                    >

                        <i class="bi bi-pencil"></i>

                    </button>

                    <button

                        class="btn btn-sm btn-danger delete-btn"

                        data-id="${blog.id}"

                    >

                        <i class="bi bi-trash"></i>

                    </button>

                </div>

            </td>

        </tr>

        `;

    });

    blogTableBody.innerHTML = html;

    initializeTableButtons();

}

/* ======================================================
   TABLE BUTTONS
====================================================== */

function initializeTableButtons(){

    document

    .querySelectorAll(".edit-btn")

    .forEach(button=>{

        button.addEventListener(

            "click",

            ()=>{

                openEditModal(

                    button.dataset.id

                );

            }

        );

    });



    document

    .querySelectorAll(".delete-btn")

    .forEach(button=>{

        button.addEventListener(

            "click",

            ()=>{

                selectedBlogID=

                button.dataset.id;

                deleteModal.show();

            }

        );

    });

}

/* ======================================================
   SEARCH
====================================================== */

function filterBlogs(){

    const keyword =

        searchInput.value

        .trim()

        .toLowerCase();

    if(!keyword){

        renderBlogTable(

            blogs

        );

        return;

    }

    const filtered = blogs.filter(blog=>{

        return(

            blog.title

            .toLowerCase()

            .includes(keyword)

            ||

            blog.category

            .toLowerCase()

            .includes(keyword)

            ||

            blog.author

            .toLowerCase()

            .includes(keyword)

        );

    });

    renderBlogTable(

        filtered

    );

}

/* ======================================================
   CREATE BLOG
====================================================== */

function openCreateModal() {

    editing = false;

    selectedBlogID = null;

    modalTitle.textContent = "Create New Blog";

    blogForm.reset();

    blogIdInput.value = "";

    blogStatusInput.value = "draft";

    blogModal.show();

}

/* ======================================================
   EDIT BLOG
====================================================== */

function openEditModal(id) {

    const blog = blogs.find(

        item => item.id === id

    );

    if (!blog) return;

    editing = true;

    selectedBlogID = id;

    modalTitle.textContent = "Edit Blog";

    blogIdInput.value = blog.id;

    blogTitleInput.value = blog.title;

    blogSummaryInput.value = blog.summary;

    blogContentInput.value = blog.content;

    blogCategoryInput.value = blog.category;

    blogImageInput.value = blog.imageURL;

    blogAuthorInput.value = blog.author;

    blogStatusInput.value = blog.status;

    blogModal.show();

}

/* ======================================================
   SAVE BLOG
====================================================== */

async function saveBlog() {

    if (!validateForm()) return;

    showLoading();

    try {

        const blogData = {

            title: blogTitleInput.value.trim(),

            summary: blogSummaryInput.value.trim(),

            content: blogContentInput.value.trim(),

            category: blogCategoryInput.value,

            imageURL: blogImageInput.value.trim(),

            author: blogAuthorInput.value.trim(),

            status: blogStatusInput.value

        };

        if (editing) {

            await updateDoc(

                doc(db, "blogs", selectedBlogID),

                blogData

            );

            showToast(

                "Blog updated successfully",

                "success"

            );

        }

        else {

            blogData.createdAt = serverTimestamp();

            await addDoc(

                collection(db, "blogs"),

                blogData

            );

            showToast(

                "Blog created successfully",

                "success"

            );

        }

        blogModal.hide();

        blogForm.reset();

        refreshDashboard();

    }

    catch (error) {

        console.error(error);

        showToast(

            "Something went wrong.",

            "danger"

        );

    }

    finally {

        hideLoading();

    }

}

/* ======================================================
   DELETE BLOG
====================================================== */

async function deleteSelectedBlog() {

    if (!selectedBlogID) return;

    showLoading();

    try {

        await deleteDoc(

            doc(

                db,

                "blogs",

                selectedBlogID

            )

        );

        deleteModal.hide();

        showToast(

            "Blog deleted.",

            "success"

        );

        refreshDashboard();

    }

    catch (error) {

        console.error(error);

        showToast(

            "Delete failed.",

            "danger"

        );

    }

    finally {

        hideLoading();

    }

}

/* ======================================================
   VALIDATION
====================================================== */

function validateForm() {

    if (

        !blogTitleInput.value.trim() ||

        !blogSummaryInput.value.trim() ||

        !blogContentInput.value.trim() ||

        !blogCategoryInput.value ||

        !blogImageInput.value.trim() ||

        !blogAuthorInput.value.trim()

    ) {

        showToast(

            "Please complete all fields.",

            "warning"

        );

        return false;

    }

    return true;

}

/* ======================================================
   RESET FORM
====================================================== */

function resetForm() {

    editing = false;

    selectedBlogID = null;

    blogForm.reset();

    blogIdInput.value = "";

}

/* ======================================================
   TOAST
====================================================== */

function showToast(message, type = "success") {

    const container = document.getElementById("toastContainer");

    const toast = document.createElement("div");

    toast.className = `toast align-items-center text-bg-${type} border-0`;

    toast.role = "alert";

    toast.innerHTML = `

        <div class="d-flex">

            <div class="toast-body">

                ${message}

            </div>

            <button
                type="button"
                class="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast">
            </button>

        </div>

    `;

    container.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, {

        delay: 3000

    });

    bsToast.show();

    toast.addEventListener("hidden.bs.toast", () => {

        toast.remove();

    });

}

/* ======================================================
   FORMAT DATE
====================================================== */

function formatDate(timestamp) {

    if (!timestamp) return "-";

    const date = timestamp.toDate();

    return date.toLocaleDateString(

        "en-GB",

        {

            day: "2-digit",

            month: "short",

            year: "numeric"

        }

    );

}

/* ======================================================
   IMAGE PREVIEW
====================================================== */

const imagePreview =

    document.getElementById("imagePreview");

if (imagePreview && blogImageInput) {

    blogImageInput.addEventListener("input", () => {

        imagePreview.src =

            blogImageInput.value.trim()

            ||

            "https://placehold.co/600x350?text=Preview";

    });

}

/* ======================================================
   MODAL EVENTS
====================================================== */

document

.getElementById("blogModal")

.addEventListener(

    "hidden.bs.modal",

    () => {

        resetForm();

    }

);