const { initializeApp } = require('firebase/app');
const { getFirestore, doc, collection, getDocs, writeBatch } = require('firebase/firestore');
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

async function syncAuthentic() {
  console.log('🚀 Sincronizando 167 niveles auténticos y limpiando documentos antiguos en Firestore...');

  // 1. Obtener todos los niveles actuales de Firestore para saber cuáles borrar
  const snap = await getDocs(collection(db, 'levels'));
  const currentFirestoreIds = new Set(snap.docs.map(d => d.id));
  console.log(`Actualmente hay ${currentFirestoreIds.size} documentos en 'levels' en Firestore.`);

  // 2. IDs de los nuevos 167 niveles
  const newLevelsMap = new Map();
  levelsData.categories.forEach(c => {
    (c.levels || []).forEach(l => {
      newLevelsMap.set(l.id, { ...l, categoryId: c.id, categoryName: c.name, categoryIcon: c.icon });
    });
  });
  console.log(`Nuevos niveles válidos: ${newLevelsMap.size}`);

  // 3. Borrar documentos obsoletos/erróneos (como los de pistas de crucigrama lvl-tema-37-*, etc.)
  const idsToDelete = [];
  currentFirestoreIds.forEach(id => {
    if (!newLevelsMap.has(id)) {
      idsToDelete.push(id);
    }
  });
  console.log(`Documentos obsoletos a eliminar: ${idsToDelete.length}`);

  let deleteBatch = writeBatch(db);
  let delCount = 0;
  for (const id of idsToDelete) {
    deleteBatch.delete(doc(db, 'levels', id));
    delCount++;
    if (delCount % 400 === 0) {
      await deleteBatch.commit();
      deleteBatch = writeBatch(db);
    }
  }
  if (delCount % 400 !== 0) {
    await deleteBatch.commit();
  }
  console.log(`✅ ${idsToDelete.length} documentos obsoletos eliminados.`);

  // 4. Subir / Actualizar los 167 niveles auténticos
  let saveBatch = writeBatch(db);
  let saveCount = 0;
  for (const [id, lvl] of newLevelsMap) {
    const lvlRef = doc(db, 'levels', id);
    saveBatch.set(lvlRef, {
      id: lvl.id,
      categoryId: lvl.categoryId,
      categoryName: lvl.categoryName,
      categoryIcon: lvl.categoryIcon,
      title: lvl.title,
      clue: lvl.clue,
      words: lvl.words,
      updatedAt: new Date().toISOString()
    });
    saveCount++;
    if (saveCount % 400 === 0) {
      await saveBatch.commit();
      saveBatch = writeBatch(db);
    }
  }
  if (saveCount % 400 !== 0) {
    await saveBatch.commit();
  }
  console.log(`✅ ${saveCount} niveles auténticos guardados en Firestore.`);

  // 5. Actualizar categorías
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
  console.log(`✅ ${levelsData.categories.length} categorías actualizadas en Firestore.`);

  console.log('\n🎉 ¡Limpieza y sincronización auténtica completada con éxito!');
  process.exit(0);
}

syncAuthentic().catch(err => {
  console.error('❌ Error en sincronización:', err);
  process.exit(1);
});
