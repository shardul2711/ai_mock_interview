// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZzCvxXsCPiO96ygPSwafK5ZzgGayX2-4",
  authDomain: "prepwise-c21f5.firebaseapp.com",
  projectId: "prepwise-c21f5",
  storageBucket: "prepwise-c21f5.firebasestorage.app",
  messagingSenderId: "17184466447",
  appId: "1:17184466447:web:d38e21d3f5b7f3db41257a",
  measurementId: "G-3W23W2C1YR"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig): getApp();

export const auth = getAuth(app);
export const db= getFirestore(app)