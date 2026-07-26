import {
    auth,
    db,
    onAuthStateChanged,
    collection,
    query,
    where,
    getDocs
} from "./firebase.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "auth.html";
        return;
    }

    const q = query(
        collection(db, "accounts"),
        where("uid", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty || !snapshot.docs[0].data().isAdmin) {
        alert("Access denied.");
        window.location.href = "index.html";
    }
});





import { db } from "./firebase.js";

import {

collection,
addDoc,
getDocs,
deleteDoc,
doc,
serverTimestamp,
orderBy,
query

} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const form = document.getElementById("blogForm");

document.getElementById("newBlog").onclick = () => {

form.classList.toggle("hidden");

};

document.getElementById("publish").onclick = async () => {

await addDoc(collection(db,"blogs"),{

title:title.value,

summary:summary.value,

content:content.value,

imageURL:imageURL.value,

createdAt:serverTimestamp()

});

loadBlogs();

};

async function loadBlogs(){

const snapshot = await getDocs(

query(

collection(db,"blogs"),

orderBy("createdAt","desc")

)

);

blogList.innerHTML="";

snapshot.forEach(blog=>{

const data = blog.data();

blogList.innerHTML += `

<div class="blog">

<img src="${data.imageURL}">

<h2>${data.title}</h2>

<p>${data.summary}</p>

<button onclick="editBlog('${blog.id}')">

Edit

</button>

<button onclick="deleteBlog('${blog.id}')">

Delete

</button>

</div>

`;

});

}

loadBlogs();

window.deleteBlog = async function(id){

await deleteDoc(doc(db,"blogs",id));

loadBlogs();

}