//ce file et le meme que file firebaseconfig.js mais sans Google Analytics

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAOsSPzP7Tv6KhCXKANUil1mxtL-TM9ltI",
  authDomain: "car-reservation-app-57c38.firebaseapp.com",
  projectId: "car-reservation-app-57c38",
  storageBucket: "car-reservation-app-57c38.appspot.com",
  messagingSenderId: "435671559575",
  appId: "1:435671559575:web:6ec1738d05063a5bb468d2",
  measurementId: "G-S05ZSDZ14C"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
