import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZSlvbio0i5l9CfYjpTAi6r5ofx8kid9k",
  authDomain: "meu-pwa-jogos.firebaseapp.com",
  projectId: "meu-pwa-jogos",
  storageBucket: "meu-pwa-jogos.firebasestorage.app",
  messagingSenderId: "773974422090",
  appId: "1:773974422090:web:8151b33185e63fa37dacb3"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
