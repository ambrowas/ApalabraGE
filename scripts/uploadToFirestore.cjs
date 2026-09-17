const { initializeApp } = require('firebase/app');
const { getFirestore, doc, writeBatch } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

const levelsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/levels.json'), 'utf8')
);

async function uploadToFirestore() {
  console.log('🚀 Iniciando sincronización masiva de 232 niveles con Cloud Firestore...');
  
  let totalCats = levelsData.categories.length;
  let totalLvls = 0;
  levelsData.categories.forEach(c => totalLvls += (c.levels || []).length);
  console.log(`Subiendo ${totalCats} categorías y ${totalLvls} niveles a las colecciones 'categories' y 'levels'...`);

  // 1. Subir Categorías
  const catBatch = writeBatch(db);
  for (const cat of levelsData.categories) {
    const catRef = doc(db, 'categories', cat.id);
    catBatch.set(catRef, {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      description: cat.description,
      totalLevels: cat.levels.length,
      updatedAt: new Date().toISOString()
    });
  }
  await catBatch.commit();
  console.log(`✅ ${totalCats} categorías sincronizadas en Firestore.`);

  // 2. Subir Niveles en lotes (batch limit = 400)
  let currentBatch = writeBatch(db);
  let batchCount = 0;
  let savedCount = 0;

  for (const cat of levelsData.categories) {
    for (const lvl of cat.levels) {
      const lvlRef = doc(db, 'levels', lvl.id);
      currentBatch.set(lvlRef, {
        id: lvl.id,
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        title: lvl.title,
        clue: lvl.clue,
        words: lvl.words,
        updatedAt: new Date().toISOString()
      });
      batchCount++;
      savedCount++;

      if (batchCount >= 400) {
        console.log(`⏳ Guardando lote de ${batchCount} niveles (${savedCount}/${totalLvls})...`);
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    console.log(`⏳ Guardando lote final de ${batchCount} niveles (${savedCount}/${totalLvls})...`);
    await currentBatch.commit();
  }

  console.log(`🎉 ¡Sincronización completa! Se han guardado ${savedCount} niveles en Cloud Firestore.`);
  process.exit(0);
}

uploadToFirestore().catch(err => {
  console.error('❌ Error subiendo a Firestore:', err);
  process.exit(1);
});
