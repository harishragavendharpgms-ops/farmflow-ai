import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUbcS4ck61woqX-gV1lVs8s_PpbsOd4D0",
  authDomain: "fireflow-b8437.firebaseapp.com",
  projectId: "fireflow-b8437",
  storageBucket: "fireflow-b8437.firebasestorage.app",
  messagingSenderId: "588051602136",
  appId: "1:588051602136:web:774f1210024645c168d5ad",
  measurementId: "G-DTHPHHFGH9"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);