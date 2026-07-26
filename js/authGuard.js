/* ======================================================
   AUTH GUARD
====================================================== */

import {

    auth,
    db,

    onAuthStateChanged,

    doc,
    getDoc

} from "./firebase.js";


/* ======================================================
   WAIT FOR AUTH
====================================================== */

export function waitForAuth() {

    return new Promise((resolve) => {

        const unsubscribe = onAuthStateChanged(

            auth,

            (user) => {

                unsubscribe();

                resolve(user);

            }

        );

    });

}


/* ======================================================
   REQUIRE LOGIN
====================================================== */

export async function requireAuth() {

    const user = await waitForAuth();

    if (!user) {

        window.location.href = "auth.html";

        return null;

    }

    return user;

}


/* ======================================================
   GET PROFILE
====================================================== */

export async function getCurrentUser() {

    const firebaseUser = await requireAuth();

    if (!firebaseUser) return null;

    try {

        const snapshot = await getDoc(

            doc(

                db,

                "accounts",

                firebaseUser.uid

            )

        );

        if (!snapshot.exists()) {

            return {

                firebaseUser,

                profile: null

            };

        }

        return {

            firebaseUser,

            profile: snapshot.data()

        };

    }

    catch (error) {

        console.error(error);

        return {

            firebaseUser,

            profile: null

        };

    }

}


/* ======================================================
   ADMIN ONLY
====================================================== */

export async function requireAdmin() {

    const user = await getCurrentUser();

    if (!user) return null;

    if (!user.profile?.isAdmin) {

        window.location.href = "index.html";

        return null;

    }

    return user;

}