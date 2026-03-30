import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDohco0U6giebeC-c7xc3zWRsMLbKKviNY",
  authDomain: "musical-rhythms-3ebf8.firebaseapp.com",
  projectId: "musical-rhythms-3ebf8",
  storageBucket: "musical-rhythms-3ebf8.firebasestorage.app",
  messagingSenderId: "126385050007",
  appId: "1:126385050007:web:7fc40c93274515054cf4d2",
  measurementId: "G-FCJBE884N6",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
