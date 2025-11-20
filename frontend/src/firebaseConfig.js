// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyvGTl21W5eQu1GUfre9MGiE23Gm_S8m0",
  authDomain: "lavanderiaelcobre-4212b.firebaseapp.com",
  projectId: "lavanderiaelcobre-4212b",
  storageBucket: "lavanderiaelcobre-4212b.firebasestorage.app",
  messagingSenderId: "250289358691",
  appId: "1:250289358691:web:05d026af7a59ecb98f3556",
  measurementId: "G-S8HV70WF2M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app); 
export const db = getFirestore(app);
export const storage = getStorage(app);