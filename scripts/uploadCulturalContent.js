/**
 * Script de sincronización del Banco Cultural con Firestore
 * Sube categorías, niveles y términos con sus explicaciones al proyecto Firebase 'apalabrage'.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import levelsData from '../src/data/levels.json' with { type: 'json' };

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadContent() {
  console.log('🚀 Iniciando subida del banco cultural a Firestore en proyecto apalabrage...');

  try {
    for (const cat of levelsData.categories) {
      console.log(`Subiendo categoría: ${cat.icon} ${cat.name} (${cat.id})...`);
      
      // Guardar categoría
      const catRef = doc(db, 'categories', cat.id);
      await setDoc(catRef, {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        totalLevels: cat.levels.length,
        updatedAt: new Date().toISOString()
      });

      // Guardar cada nivel
      for (const lvl of cat.levels) {
        console.log(`   - Nivel: [${lvl.id}] ${lvl.title} (${lvl.words.length} palabras)`);
        const lvlRef = doc(db, 'cultural_content', lvl.id);
        await setDoc(lvlRef, {
          id: lvl.id,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          title: lvl.title,
          clue: lvl.clue,
          gridSize: lvl.gridSize,
          words: lvl.words,
          updatedAt: new Date().toISOString()
        });
      }
    }

    console.log('\n🎉 ¡Banco cultural subido exitosamente a Firestore!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al subir a Firestore:', error);
    process.exit(1);
  }
}

uploadContent();
