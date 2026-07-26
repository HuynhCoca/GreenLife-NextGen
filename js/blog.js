import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const id = new URLSearchParams(window.location.search).get("id");

async function loadBlog() {

    const snap = await getDoc(doc(db, "blogs", id));

    if (!snap.exists()) {

        document.body.innerHTML = "<h1>Blog not found</h1>";
        return;

    }

    const blog = snap.data();

    document.getElementById("title").textContent = blog.title;
    document.getElementById("author").textContent = "By " + blog.author;
    document.getElementById("image").src = blog.imageURL;
    document.getElementById("content").innerHTML = blog.content;

}

loadBlog();