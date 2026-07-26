// =====================================
// Firebase Configuration
// =====================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

// =====================================
// Firebase Authentication
// =====================================

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    fetchSignInMethodsForEmail,
    verifyPasswordResetCode,
    confirmPasswordReset
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// =====================================
// Cloud Firestore
// =====================================

import {
    getFirestore,

    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,

    collection,
    addDoc,

    getDocs,

    query,
    where,
    orderBy,
    limit,

    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// =====================================
// Firebase Config
// =====================================

const firebaseConfig = {
  apiKey: "AIzaSyBke6xPi6MaU2GTeDxXpBR6JImAKJkvjSk",
  authDomain: "nextgen-greenbit.firebaseapp.com",
  projectId: "nextgen-greenbit",
  storageBucket: "nextgen-greenbit.firebasestorage.app",
  messagingSenderId: "1000235124911",
  appId: "1:1000235124911:web:51c19b054f1b1a3ebeac5a",
  measurementId: "G-4QHXHTTYX0"
};

// =====================================
// Initialize Firebase
// =====================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

// =====================================
// Export Everything
// =====================================

export {

    auth,
    db,

    // Firestore

    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,

    collection,
    addDoc,
    getDocs,

    query,
    where,
    orderBy,
    limit,

    serverTimestamp,

    // Authentication

    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,

    onAuthStateChanged,

    sendPasswordResetEmail,

    fetchSignInMethodsForEmail,

    verifyPasswordResetCode,

    confirmPasswordReset

};