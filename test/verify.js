import levelsData from '../src/data/levels.json' with { type: 'json' };
import { GridEngine } from '../src/core/gridEngine.js';

console.log('=== Verificación de ApalabraGE ===\n');

let totalLevels = 0;
let passedLevels = 0;

levelsData.categories.forEach(cat => {
  console.log(`Categoría: ${cat.icon} ${cat.name}`);
  cat.levels.forEach(lvl => {
    totalLevels++;
    const cols = lvl.gridSize?.cols || 4;
    const rows = lvl.gridSize?.rows || 5;
    const board = GridEngine.generateBoard(lvl.words, cols, rows);

    // Validar dimensiones
    const actualRows = board.grid.length;
    const actualCols = board.grid[0].length;
    const tileCount = board.tileList.length;
    const totalLetters = lvl.words.reduce((sum, w) => sum + w.word.replace(/[^a-zA-ZñÑ]/g, '').length, 0);

    if (tileCount === totalLetters && actualCols === cols) {
      console.log(`  ✓ [${lvl.id}] "${lvl.title}" (${lvl.words.length} palabras, ${tileCount} fichas, ${actualRows}x${actualCols})`);
      passedLevels++;
    } else {
      console.error(`  ✗ [${lvl.id}] Error en conteo de letras: esperado ${totalLetters}, obtenido ${tileCount}`);
    }

    // Probar gravedad dropTiles simulando la remoción de la primera palabra
    const firstWordTiles = board.tileList.filter(t => t.word === lvl.words[0].word.toUpperCase().replace(/[^A-ZÑ]/g, ''));
    const { newGrid, drops } = GridEngine.dropTiles(board.grid, firstWordTiles);
    if (!newGrid || newGrid.length !== actualRows) {
      console.error(`  ✗ Error en dropTiles para ${lvl.id}`);
    }
  });
  console.log('');
});

console.log(`Resultado: ${passedLevels}/${totalLevels} niveles validados correctamente.`);

if (passedLevels === totalLevels) {
  console.log('¡TODAS LAS PRUEBAS DE LA CUADRÍCULA Y GRAVEDAD PASARON CON ÉXITO!');
  process.exit(0);
} else {
  process.exit(1);
}
