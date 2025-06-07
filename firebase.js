// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyCMjPC6UxihcYQcfcfIVL_AMU2_cv6vFKk",
authDomain: "skins-bf0b8.firebaseapp.com",
projectId: "skins-bf0b8",
storageBucket: "skins-bf0b8.firebasestorage.app",
messagingSenderId: "1098242246222",
appId: "1:1098242246222:web:c9369feb045f2cf22f251f",
measurementId: "G-MZV1N2JSQ0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
