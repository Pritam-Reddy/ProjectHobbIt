// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// (Paste the keys you copied from the website here)
const firebaseConfig = {

  apiKey: "AIzaSyAdXdoY06-xHNCybwo4pnP2RP4mr2yaj9o",

  authDomain: "projecthobbit-f83e9.firebaseapp.com",

  projectId: "projecthobbit-f83e9",

  storageBucket: "projecthobbit-f83e9.firebasestorage.app",

  messagingSenderId: "30647409104",

  appId: "1:30647409104:web:b88c8eb600311cd12181d5",

  measurementId: "G-N9D88BF5L8"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);