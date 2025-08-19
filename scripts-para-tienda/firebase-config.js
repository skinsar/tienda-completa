import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyDF5VILDrZjPEQzmQsa8tLrl4SSauWYD48",
authDomain: "skins-bf0b8.firebaseapp.com",
projectId: "skins-bf0b8",
storageBucket: "skins-bf0b8.firebasestorage.app",
messagingSenderId: "1098242246222",
appId: "1:1098242246222:web:c9369feb045f2cf22f251f",
measurementId: "G-MZV1N2JSQ0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
