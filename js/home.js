import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';

const authLink = document.getElementById('authLink');
const logoutBtn = document.getElementById('logoutBtn');
const userBadge = document.getElementById('userBadge');

function updateUserUI(user) {
  if (user) {
    authLink.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userBadge.textContent = `Signed in as ${user.email || 'user'}`;
  } else {
    authLink.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userBadge.textContent = 'No user signed in';
  }
}

onAuthStateChanged(auth, (user) => {
  updateUserUI(user);
});

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = 'auth.html';
  });
});

card.innerHTML = `
    <img src="${blog.imageURL}" alt="${blog.title}">

    <h3>${blog.title}</h3>

    <p>${blog.summary}</p>

    <small>By ${blog.author}</small>

    <a href="blog.html?id=${doc.id}">
        Read More
    </a>
`;

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const blogGrid = document.getElementById("blogGrid");

async function loadBlogs() {

    const q = query(
        collection(db, "blogs"),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    blogGrid.innerHTML = "";

    snapshot.forEach((doc) => {

        const blog = doc.data();

        blogGrid.innerHTML += `

        <article class="blog-card">

            <img src="${blog.imageURL}" alt="${blog.title}">

            <h3>${blog.title}</h3>

            <p>${blog.summary}</p>

            <small>
                By ${blog.author}
            </small>

            <br><br>

            <a href="blog.html?id=${doc.id}">
                Read More →
            </a>

        </article>

        `;

    });

}

loadBlogs();



import {
    auth,
    db,
    collection,
    query,
    where,
    getDocs,
    onAuthStateChanged
} from "./firebase.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) return;

    const q = query(
        collection(db, "accounts"),
        where("uid", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const account = snapshot.docs[0].data();

    if (account.isAdmin) {

        const nav = document.querySelector(".nav-links");

        nav.innerHTML += `
            <a href="dashboard.html">
                Dashboard
            </a>
        `;

    }

});