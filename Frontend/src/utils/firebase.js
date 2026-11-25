
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "fresherai-d241c.firebaseapp.com",
  projectId: "fresherai-d241c",
  storageBucket: "fresherai-d241c.firebasestorage.app",
  messagingSenderId: "765859948093",
  appId: "1:765859948093:web:6478806c06c1b224a0ec54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export {auth,provider}