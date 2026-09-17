const fs = require('fs');
const path = require('path');

const bookTopics = require('../src/data/bookTopics.json');
const currentLevelsData = require('../src/data/levels.json');

// Helper for Roman numerals
function toRoman(num) {
  const romanMap = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let res = '';
  for (const [val, rom] of romanMap) {
    while (num >= val) {
      res += rom;
      num -= val;
    }
  }
  return res || 'I';
}

// Accent normalization
function cleanWord(str) {
  if (!str) return '';
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics except Ñ if possible
    .replace(/[^A-ZÑ]/g, '');
}

// Words to exclude (stop words, numbers, roman numerals)
const STOP_WORDS = new Set([
  'DEL', 'LOS', 'LAS', 'LES', 'SAN', 'SANTA', 'DON', 'DONA', 'UNA', 'UNO', 'POR', 'CON', 'SIN',
  'PARA', 'DESDE', 'HASTA', 'SOBRE', 'ENTRE', 'HACIA', 'ESTE', 'OESTE', 'SUR', 'NORTE',
  'III', 'VII', 'VIII', 'XVI', 'XIX', 'XXI'
]);

// Extract base levels (those not starting with lvl-tema-)
const baseLevelsByCat = {};
currentLevelsData.categories.forEach(c => {
  baseLevelsByCat[c.id] = (c.levels || []).filter(l => !l.id.startsWith('lvl-tema-'));
});

// Category canonical mapping
const validCats = [
  'deporte_nacional',
  'etnias_identidad',
  'gastronomia',
  'geografia',
  'historia_pioneros',
  'musica_arte',
  'selva_fauna',
  'modismos'
];

function getCanonicalCat(t) {
  const cId = t.categoryId;
  if (validCats.includes(cId)) return cId;
  const title = (t.cleanTitle || t.title || '').toUpperCase();
  if (title.includes('BASKET') || title.includes('FUTBOL') || title.includes('NZALANG') || title.includes('DEPORTE')) return 'deporte_nacional';
  if (title.includes('PLATOS') || title.includes('COCINA') || title.includes('ALIMENTO') || title.includes('BEBIDAS') || title.includes('GASTRONOM')) return 'gastronomia';
  if (title.includes('BARRIOS') || title.includes('CIUDADES') || title.includes('RIOS') || title.includes('ISLAS') || title.includes('CAPITALES') || title.includes('HOTELES') || title.includes('POBLADOS')) return 'geografia';
  if (title.includes('CANTANTES') || title.includes('CANCIONES') || title.includes('ARTISTAS') || title.includes('MAELE') || title.includes('CINE') || title.includes('FOLKLORE')) return 'musica_arte';
  if (title.includes('FAUNA') || title.includes('ANIMALES') || title.includes('SELVA') || title.includes('FLORA')) return 'selva_fauna';
  if (title.includes('MODISMOS') || title.includes('EXPRESIONES')) return 'modismos';
  if (title.includes('APELLIDOS') || title.includes('NOMBRES') || title.includes('BUBIS') || title.includes('FANG') || title.includes('NDOWE') || title.includes('MUJER') || title.includes('TRIBUS')) return 'etnias_identidad';
  return 'historia_pioneros';
}

const generatedLevelsByCat = {};
validCats.forEach(c => {
  generatedLevelsByCat[c] = [];
});

let totalSubLevels = 0;
let totalWordsExtracted = 0;

bookTopics.forEach(t => {
  const catId = getCanonicalCat(t);
  const cleanTitle = (t.cleanTitle || t.title.replace(/^\d+[\.\s]*/, '')).trim().toUpperCase();
  const rawWords = t.words || [];

  const seen = new Set();
  const words6 = [];
  const words7 = [];

  rawWords.forEach(entry => {
    const parts = entry.split(/[\s\-_,\.\/]+/);
    parts.forEach(p => {
      const w = cleanWord(p);
      if (w.length >= 3 && !STOP_WORDS.has(w) && !seen.has(w)) {
        seen.add(w);
        if (w.length <= 6) {
          words6.push(w);
        } else if (w.length === 7) {
          words7.push(w);
        }
      }
    });
  });

  // Combine words: prioritize <= 6, add 7-letter words if needed
  let pool = [...words6];
  if (pool.length < 8 && words7.length > 0) {
    pool.push(...words7);
  }

  // If pool has fewer than 3 words, skip or fallback
  if (pool.length < 3) return;

  // Split into chunks of 5 words (minimum 4, maximum 6)
  const chunkSize = 5;
  const chunks = [];
  for (let i = 0; i < pool.length; i += chunkSize) {
    const slice = pool.slice(i, i + chunkSize);
    if (slice.length >= 4) {
      chunks.push(slice);
    } else if (chunks.length > 0) {
      // Append remainder to last chunk
      chunks[chunks.length - 1].push(...slice);
    } else if (slice.length >= 3) {
      chunks.push(slice);
    }
  }

  const topicNum = t.number || (t.id ? t.id.replace(/\D/g, '') : '0');

  chunks.forEach((chunk, idx) => {
    totalSubLevels++;
    totalWordsExtracted += chunk.length;
    const roman = chunks.length > 1 ? ` ${toRoman(idx + 1)}` : '';
    const levelId = `lvl-tema-${topicNum}-${idx + 1}`;
    const levelTitle = `${cleanTitle}${roman}`;
    
    generatedLevelsByCat[catId].push({
      id: levelId,
      title: levelTitle,
      categoryId: catId,
      clue: `Descubre los términos de ${cleanTitle}${roman ? ' (' + toRoman(idx + 1) + ')' : ''}`,
      words: chunk.map(w => ({
        word: w,
        clue: `Término cultural de ${cleanTitle} en Guinea Ecuatorial.`
      }))
    });
  });
});

console.log(`Sub-niveles generados desde el PDF: ${totalSubLevels}`);
console.log(`Palabras cortas extraídas y utilizadas: ${totalWordsExtracted}`);

// Now merge with base levels
let grandTotalLevels = 0;
let grandTotalWords = 0;

const updatedCategories = currentLevelsData.categories.map(cat => {
  const base = baseLevelsByCat[cat.id] || [];
  const generated = generatedLevelsByCat[cat.id] || [];
  const allLevels = [...base, ...generated];

  grandTotalLevels += allLevels.length;
  allLevels.forEach(l => {
    grandTotalWords += (l.words || []).length;
  });

  return {
    ...cat,
    levels: allLevels
  };
});

console.log('\n--- RESUMEN FINAL ---');
console.log(`Total de Categorías: ${updatedCategories.length}`);
console.log(`Total de Niveles / Juegos: ${grandTotalLevels}`);
console.log(`Total de Palabras Culturales: ${grandTotalWords}`);

updatedCategories.forEach(c => {
  console.log(`- ${c.icon || ''} ${c.name} (${c.id}): ${c.levels.length} niveles`);
});

// Write to src/data/levels.json
const finalOutput = {
  categories: updatedCategories
};

fs.writeFileSync(
  path.join(__dirname, '../src/data/levels.json'),
  JSON.stringify(finalOutput, null, 2),
  'utf8'
);

console.log('\n✅ Archivo src/data/levels.json actualizado con éxito!');
