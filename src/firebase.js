/**
 * Configuración de Firebase y Firestore para ApalabraGE
 * Proyecto: apalabrage
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "apalabrage",
  appId: "1:157627207584:web:2517e4731663b4e58d1ec5",
  storageBucket: "apalabrage.firebasestorage.app",
  apiKey: "AIzaSyB7UuydppcwE2oBAPuxapWhkrxVxMugBJY",
  authDomain: "apalabrage.firebaseapp.com",
  messagingSenderId: "157627207584",
  measurementId: "G-60FTKHD2WM",
  projectNumber: "157627207584"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
