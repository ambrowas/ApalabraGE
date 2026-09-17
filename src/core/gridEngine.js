/**
 * ApalabraGE - Motor de Cuadrícula y Física de Colapso
 * Generación por apilamiento inverso garantizado y cálculo de gravedad dropTiles.
 */

export class GridEngine {
  constructor(cols = 4, rows = 5) {
    this.cols = cols;
    this.rows = rows;
  }

  /**
   * Genera el tablero para una lista de palabras usando apilamiento inverso.
   * Garantiza que el juego siempre tiene una solución válida (al menos el orden inverso de inserción).
   * @param {Array<{word: string, clue: string}>} wordsList
   * @param {number} cols
   * @param {number} rows
   * @returns {{ grid: Array<Array<any>>, tileList: Array<any>, solutionOrder: Array<string> }}
   */
  static generateBoard(wordsList, cols = 4, rows = 6) {
    const words = wordsList.map(w => ({
      word: w.word.toUpperCase().replace(/[^A-ZÑ]/g, ''),
      original: w.word,
      clue: w.clue
    }));

    // Intentar construir por inserción inversa
    for (let attempt = 0; attempt < 100; attempt++) {
      const generated = this._tryReverseStacking(words, cols, rows);
      if (generated) {
        return generated;
      }
    }

    // Si el algoritmo aleatorio complejo no converge en 100 intentos,
    // usamos el método de empaquetado estructurado garantizado.
    return this._fallbackStructuredStacking(words, cols, rows);
  }

  /**
   * Intento de apilamiento inverso:
   * Empieza con columnas vacías. Inserta cada palabra de modo que sus letras queden contiguas
   * al insertarse (quedando disponibles para ser seleccionadas en el juego).
   */
  static _tryReverseStacking(words, cols, maxRows) {
    // columns[c] es un array de letras apiladas desde abajo (índice 0 = fondo) hacia arriba
    let columns = Array.from({ length: cols }, () => []);
    let tileIdCounter = 1;
    let placedWords = [];

    // Barajamos el orden de inserción para variedad
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);

    for (const wordObj of shuffledWords) {
      const letters = wordObj.word.split('');
      const wordLen = letters.length;

      // Buscar una ruta contigua en la "superficie" o insertable
      const placement = this._findReversePlacement(columns, letters, cols, maxRows, wordObj.word);
      if (!placement) {
        return null; // Falló este intento, reintentar
      }

      // Aplicar inserción en las columnas
      for (const item of placement) {
        const col = item.col;
        const insertIdx = item.insertIndex;
        const tile = {
          id: `tile-${tileIdCounter++}`,
          letter: item.letter,
          word: wordObj.word,
          originalWord: wordObj.original
        };
        columns[col].splice(insertIdx, 0, tile);
      }

      placedWords.unshift(wordObj.word); // La última insertada es la primera que se puede resolver
    }

    // Convertir columnas a matriz 2D de tamaño [maxRows][cols]
    // Determinamos la altura máxima real
    const actualMaxHeight = Math.max(...columns.map(c => c.length), 1);
    const finalRows = Math.max(actualMaxHeight, maxRows);

    // grid[r][c] donde r=0 es la fila superior y r=finalRows-1 es el fondo
    const grid = Array.from({ length: finalRows }, () => Array(cols).fill(null));
    const tileList = [];

    for (let c = 0; c < cols; c++) {
      const colTiles = columns[c];
      for (let i = 0; i < colTiles.length; i++) {
        // En columns[c], 0 es el fondo -> en grid, finalRows - 1 - i es la fila
        const r = finalRows - 1 - i;
        const tile = {
          ...colTiles[i],
          row: r,
          col: c
        };
        grid[r][c] = tile;
        tileList.push(tile);
      }
    }

    return {
      grid,
      cols,
      rows: finalRows,
      tileList,
      solutionOrder: placedWords
    };
  }

  /**
   * Encuentra una colocación válida para las letras de una palabra sobre las columnas actuales.
   */
  static _findReversePlacement(columns, letters, cols, maxRows, wordStr) {
    const wordLen = letters.length;
    // Buscamos una secuencia de posiciones adyacentes
    // Para simplificar y hacer la física 100% natural, colocamos la palabra en la parte superior
    // actual de las columnas (o intercalada) con conexión contigua de celdas (dx, dy <= 1).

    // Probamos diferentes puntos de inicio
    const colIndices = Array.from({ length: cols }, (_, i) => i).sort(() => Math.random() - 0.5);

    for (const startCol of colIndices) {
      const currentHeight = columns[startCol].length;
      if (currentHeight >= maxRows) continue;

      const path = [{
        col: startCol,
        rowFromBottom: currentHeight,
        insertIndex: currentHeight,
        letter: letters[0]
      }];

      if (this._stepPlacement(columns, letters, 1, path, cols, maxRows)) {
        return path;
      }
    }

    return null;
  }

  static _stepPlacement(columns, letters, letterIdx, currentPath, cols, maxRows) {
    if (letterIdx >= letters.length) {
      return true;
    }

    const prevStep = currentPath[currentPath.length - 1];
    const prevCol = prevStep.col;
    const prevRow = prevStep.rowFromBottom;

    // Probar vecinos: izquierda, derecha, arriba (en la misma columna), diagonales
    // Movimientos relativos [dCol, dRow]
    const deltas = [
      [0, 1],   // arriba
      [1, 0],   // derecha
      [-1, 0],  // izquierda
      [1, 1],   // diagonal arriba-der
      [-1, 1],  // diagonal arriba-izq
      [1, -1],  // diagonal abajo-der
      [-1, -1]  // diagonal abajo-izq
    ].sort(() => Math.random() - 0.5);

    for (const [dc, dr] of deltas) {
      const nextCol = prevCol + dc;
      if (nextCol < 0 || nextCol >= cols) continue;

      // Calcular cuántas letras ya hemos propuesto poner en nextCol en este path
      const alreadyInCol = currentPath.filter(p => p.col === nextCol).length;
      const baseHeight = columns[nextCol].length;
      const totalColHeight = baseHeight + alreadyInCol;

      if (totalColHeight >= maxRows) continue;

      const nextRow = baseHeight + alreadyInCol;
      // Verificar contigüidad con el paso previo
      const rowDiff = Math.abs(nextRow - prevRow);
      const colDiff = Math.abs(nextCol - prevCol);

      if (rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0)) {
        currentPath.push({
          col: nextCol,
          rowFromBottom: nextRow,
          insertIndex: columns[nextCol].length,
          letter: letters[letterIdx]
        });

        if (this._stepPlacement(columns, letters, letterIdx + 1, currentPath, cols, maxRows)) {
          return true;
        }

        currentPath.pop();
      }
    }

    return false;
  }

  /**
   * Método de respaldo estructurado y elegante si la aleatoriedad estricta no encuentra camino.
   */
  static _fallbackStructuredStacking(words, cols, maxRows) {
    let tileIdCounter = 1;
    let columns = Array.from({ length: cols }, () => []);

    // Colocamos las palabras serpentina en las columnas
    let currentCol = 0;
    let direction = 1;

    for (const wordObj of words) {
      const letters = wordObj.word.split('');
      for (const char of letters) {
        columns[currentCol].push({
          id: `tile-${tileIdCounter++}`,
          letter: char,
          word: wordObj.word,
          originalWord: wordObj.original
        });

        currentCol += direction;
        if (currentCol >= cols) {
          currentCol = cols - 1;
          direction = -1;
        } else if (currentCol < 0) {
          currentCol = 0;
          direction = 1;
        }
      }
    }

    const actualMaxHeight = Math.max(...columns.map(c => c.length), maxRows);
    const grid = Array.from({ length: actualMaxHeight }, () => Array(cols).fill(null));
    const tileList = [];

    for (let c = 0; c < cols; c++) {
      const colTiles = columns[c];
      for (let i = 0; i < colTiles.length; i++) {
        const r = actualMaxHeight - 1 - i;
        const tile = {
          ...colTiles[i],
          row: r,
          col: c
        };
        grid[r][c] = tile;
        tileList.push(tile);
      }
    }

    return {
      grid,
      cols,
      rows: actualMaxHeight,
      tileList,
      solutionOrder: words.map(w => w.word)
    };
  }

  /**
   * Verifica si dos celdas son contiguas (adyacentes horizontal, vertical o diagonalmente).
   */
  static areAdjacent(tileA, tileB) {
    if (!tileA || !tileB) return false;
    const dr = Math.abs(tileA.row - tileB.row);
    const dc = Math.abs(tileA.col - tileB.col);
    return (dr <= 1 && dc <= 1) && !(dr === 0 && dc === 0);
  }

  /**
   * Calcula el colapso por gravedad (dropTiles) tras eliminar una lista de fichas.
   * Desplaza hacia abajo las fichas superiores en cada columna para rellenar los huecos.
   *
   * @param {Array<Array<any>>} currentGrid - Matriz actual [rows][cols]
   * @param {Array<any>} removedTiles - Fichas eliminadas
   * @returns {{ newGrid: Array<Array<any>>, drops: Array<{tile: any, fromRow: number, toRow: number, col: number, distance: number}> }}
   */
  static dropTiles(currentGrid, removedTiles) {
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
    const removedIds = new Set(removedTiles.map(t => t.id));

    // Nueva cuadrícula vacía
    const newGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
    const drops = [];

    // Procesar cada columna de forma independiente de abajo hacia arriba
    for (let c = 0; c < cols; c++) {
      let writeRow = rows - 1; // empezamos rellenando el fondo de la columna

      for (let r = rows - 1; r >= 0; r--) {
        const tile = currentGrid[r][c];
        if (tile && !removedIds.has(tile.id)) {
          // La ficha sobrevive
          if (r !== writeRow) {
            // Cae de r a writeRow
            const distance = writeRow - r;
            const updatedTile = {
              ...tile,
              row: writeRow,
              col: c
            };
            newGrid[writeRow][c] = updatedTile;
            drops.push({
              tile: updatedTile,
              fromRow: r,
              toRow: writeRow,
              col: c,
              distance
            });
          } else {
            // Se mantiene en su posición
            newGrid[writeRow][c] = { ...tile };
          }
          writeRow--;
        }
      }
    }

    return {
      newGrid,
      drops
    };
  }

  /**
   * Busca si alguna de las palabras pendientes está actualmente disponible de forma contigua en el tablero.
   * Útil para el potenciador de Pista (Hint).
   */
  static findAvailableWord(grid, targetWords) {
    const rows = grid.length;
    const cols = grid[0].length;

    for (const target of targetWords) {
      const letters = target.toUpperCase().split('');
      const firstChar = letters[0];

      // Buscar fichas que contengan la primera letra
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tile = grid[r][c];
          if (tile && tile.letter === firstChar) {
            const path = [tile];
            const foundPath = this._searchWordPath(grid, letters, 1, path);
            if (foundPath) {
              return { word: target, path: foundPath };
            }
          }
        }
      }
    }
    return null;
  }

  static _searchWordPath(grid, letters, letterIdx, currentPath) {
    if (letterIdx >= letters.length) {
      return currentPath;
    }

    const currentTile = currentPath[currentPath.length - 1];
    const targetChar = letters[letterIdx];

    // Vecinos contiguos
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = currentTile.row + dr;
        const nc = currentTile.col + dc;

        if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
          const neighbor = grid[nr][nc];
          if (neighbor && neighbor.letter === targetChar && !currentPath.some(t => t.id === neighbor.id)) {
            currentPath.push(neighbor);
            const res = this._searchWordPath(grid, letters, letterIdx + 1, currentPath);
            if (res) return res;
            currentPath.pop();
          }
        }
      }
    }

    return null;
  }

  /**
   * Reorganiza las fichas activas en la cuadrícula siguiendo un patrón continuo serpentina desde la base.
   * Garantiza al 100% que las palabras restantes queden adyacentes y puedan ser deslizadas sin bloqueos.
   *
   * @param {Array<Array<any>>} currentGrid
   * @param {Array<string>} unfoundWords
   * @returns {Array<Array<any>>}
   */
  static reshuffleBoard(currentGrid, unfoundWords) {
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;

    // 1. Recolectar todas las fichas activas
    const activeTiles = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (currentGrid[r][c]) {
          activeTiles.push(currentGrid[r][c]);
        }
      }
    }

    if (activeTiles.length === 0) return currentGrid;

    // 2. Crear una nueva cuadrícula vacía
    const newGrid = Array.from({ length: rows }, () => Array(cols).fill(null));

    // 3. Generar la ruta serpentina desde la fila inferior hacia arriba
    // Cada paso en esta ruta es estrictamente adyacente al anterior
    const pathCells = [];
    for (let r = rows - 1; r >= 0; r--) {
      const isEvenFromBottom = (rows - 1 - r) % 2 === 0;
      if (isEvenFromBottom) {
        for (let c = 0; c < cols; c++) pathCells.push({ row: r, col: c });
      } else {
        for (let c = cols - 1; c >= 0; c--) pathCells.push({ row: r, col: c });
      }
    }

    // 4. Ordenar las fichas por palabra pendiente para que sus letras queden contiguas
    let tilePool = [...activeTiles];
    let orderedTiles = [];

    for (const word of unfoundWords) {
      const chars = word.split('');
      for (const char of chars) {
        const foundIdx = tilePool.findIndex(t => t.letter === char);
        if (foundIdx >= 0) {
          orderedTiles.push(tilePool.splice(foundIdx, 1)[0]);
        }
      }
    }

    // Si sobró alguna ficha no identificada en unfoundWords, se añade al final
    orderedTiles = orderedTiles.concat(tilePool);

    // 5. Asignar las fichas en las celdas contiguas de la ruta
    for (let i = 0; i < orderedTiles.length && i < pathCells.length; i++) {
      const { row, col } = pathCells[i];
      const tile = {
        ...orderedTiles[i],
        row,
        col
      };
      newGrid[row][col] = tile;
    }

    return newGrid;
  }
}
