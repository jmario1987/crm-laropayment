import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Reemplaza este objeto con el que copiaste de tu consola de Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyCoqFHPcxmvLS0LZyRnGcKO5XDMHvmC8f0",
  authDomain: "crm-laropayment-app.firebaseapp.com",
  projectId: "crm-laropayment-app",
  storageBucket: "crm-laropayment-app.firebasestorage.app",
  messagingSenderId: "56596263068",
  appId: "1:56596263068:web:2b94cc8efa2ac814f6fd59"
};

// Inicializa la app principal de Firebase
const app = initializeApp(firebaseConfig);

// Exportamos los servicios para que los use toda la aplicación
export const db = getFirestore(app);
export const auth = getAuth(app);