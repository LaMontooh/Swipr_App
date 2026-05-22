// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1ltaIsDsXeRngXnGWIX9deLZd5bs3dS4",
  authDomain: "swipr-cc934.firebaseapp.com",
  projectId: "swipr-cc934",
  storageBucket: "swipr-cc934.firebasestorage.app",
  messagingSenderId: "360751608949",
  appId: "1:360751608949:web:9deaa2254ee725d822b43c",
  measurementId: "G-Q3EM4L2Q7D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
export { auth };