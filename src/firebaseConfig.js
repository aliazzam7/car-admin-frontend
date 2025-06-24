// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOsSPzP7Tv6KhCXKANUil1mxtL-TM9ltI",
  authDomain: "car-reservation-app-57c38.firebaseapp.com",
  projectId: "car-reservation-app-57c38",
  storageBucket: "car-reservation-app-57c38.appspot.com",
  messagingSenderId: "435671559575",
  appId: "1:435671559575:web:6ec1738d05063a5bb468d2",
  measurementId: "G-S05ZSDZ14C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional: Initialize Analytics (only works if you use it in a browser and enabled Analytics)
const analytics = getAnalytics(app);

// Export the services you’ll use
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);





//hol el code hene a3toni eyhon bi firebase console bi sdk:
//-------------------------------------------------------------

// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries
// src/firebaseConfig.js
// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyAOsSPzP7Tv6KhCXKANUil1mxtL-TM9ltI",
//   authDomain: "car-reservation-app-57c38.firebaseapp.com",
//   projectId: "car-reservation-app-57c38",
//   storageBucket: "car-reservation-app-57c38.firebasestorage.app",
//   messagingSenderId: "435671559575",
//   appId: "1:435671559575:web:6ec1738d05063a5bb468d2",
//   measurementId: "G-S05ZSDZ14C"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

