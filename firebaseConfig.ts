import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 1. Importamos el servicio de autenticación

// Reemplaza este objeto con el tuyo que copiaste de la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCoqFHPcxmvLS0LZyRnGcKO5XDMHvmC8f0",
  authDomain: "crm-laropayment-app.firebaseapp.com",
  projectId: "crm-laropayment-app",
  storageBucket: "crm-laropayment-app.firebasestorage.app",
  messagingSenderId: "56596263068",
  appId: "1:56596263068:web:2b94cc8efa2ac814f6fd59"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exportamos la instancia de la base de datos y la autenticación
export const db = getFirestore(app);
export const auth = getAuth(app); // 2. Exportamos el servicio de autenticación