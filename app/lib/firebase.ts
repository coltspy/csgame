// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDPxVwxZmIQb1POwga-mtuA8NKNZy2-dkw",
  authDomain: "cysecgame.firebaseapp.com",
  projectId: "cysecgame",
  storageBucket: "cysecgame.firebasestorage.app",
  messagingSenderId: "401715842640",
  appId: "1:401715842640:web:ba4c2aaae0397a44fccb55",
  measurementId: "G-3V5GY6XPVF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const analytics = getAnalytics(app);
export { db };

