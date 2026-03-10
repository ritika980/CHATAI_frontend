import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDnN4c3CaCc5dQhvLNN4ftAC7c0wo2p7J4",
  authDomain: "my-app-96a51.firebaseapp.com",
  projectId: "my-app-96a51",
  storageBucket: "my-app-96a51.firebasestorage.app",
  messagingSenderId: "1028915662175",
  appId: "1:1028915662175:web:91af0b2d6a7a69469ebaea",
  measurementId: "G-LECEDJ1QTD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: 'select_account'
});