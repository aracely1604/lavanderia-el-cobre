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
  apiKey: "AIzaSyCnCDQs1yWNyc_RzXioPCgWnXL5Y6lwW4g",
  authDomain: "lavanderia-el-cobre-app.firebaseapp.com",
  projectId: "lavanderia-el-cobre-app",
  storageBucket: "lavanderia-el-cobre-app.firebasestorage.app",
  messagingSenderId: "996591227495",
  appId: "1:996591227495:web:fe51a32cd8182ad6fe3ac2",
  measurementId: "G-FDGW1Y87Z9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app); 
export const db = getFirestore(app);
export const storage = getStorage(app);