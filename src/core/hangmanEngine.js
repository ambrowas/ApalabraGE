/**
 * Motor de Juego para «El Ahorcado de Proverbios y Sabiduría Africana»
 */

export class HangmanEngine {
  constructor(proverbs = []) {
    this.proverbs = proverbs;
    this.currentProverbIndex = 0;
    this.currentProverb = null;
    this.maxLives = 6;
    this.remainingLives = 6;
    this.guessedLetters = new Set();
    this.wrongLetters = new Set();
    this.hintsUsedThisProverb = 0;
    this.status = 'idle'; // 'idle', 'playing', 'won', 'lost'
  }

  static normalizeChar(char) {
    if (!char) return '';
    const upper = char.toUpperCase();
    if (upper === 'Ñ') return 'Ñ';
    // Remueve tildes y diéresis de vocales (A, E, I, O, U) sin afectar la Ñ
    return upper.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  static isPunctuation(char) {
    return /[\s.,;:¡!¿?'"()«»-]/.test(char);
  }

  startProverb(index = 0) {
    if (this.proverbs.length === 0) return null;
    if (index < 0 || index >= this.proverbs.length) index = 0;

    this.currentProverbIndex = index;
    this.currentProverb = this.proverbs[index];
    this.remainingLives = this.maxLives;
    this.guessedLetters = new Set();
    this.wrongLetters = new Set();
    this.hintsUsedThisProverb = 0;
    this.status = 'playing';

    return this.getGameState();
  }

  nextProverb() {
    const nextIdx = (this.currentProverbIndex + 1) % this.proverbs.length;
    return this.startProverb(nextIdx);
  }

  guess(rawLetter) {
    if (this.status !== 'playing' || !this.currentProverb) {
      return { status: 'inactive' };
    }

    const norm = HangmanEngine.normalizeChar(rawLetter);
    if (!norm || !/^[A-ZÑ]$/.test(norm)) {
      return { status: 'invalid' };
    }

    if (this.guessedLetters.has(norm) || this.wrongLetters.has(norm)) {
      return { status: 'already_guessed', letter: norm };
    }

    // Verificar si la letra existe en el refrán
    const phraseChars = Array.from(this.currentProverb.phrase).map(HangmanEngine.normalizeChar);
    const exists = phraseChars.includes(norm);

    if (exists) {
      this.guessedLetters.add(norm);
      const isWon = this._checkWinCondition();
      if (isWon) {
        this.status = 'won';
      }
      return {
        status: 'correct',
        letter: norm,
        isWon,
        state: this.getGameState()
      };
    } else {
      this.wrongLetters.add(norm);
      this.remainingLives = Math.max(0, this.remainingLives - 1);
      const isLost = this.remainingLives <= 0;
      if (isLost) {
        this.status = 'lost';
      }
      return {
        status: 'wrong',
        letter: norm,
        remainingLives: this.remainingLives,
        isLost,
        state: this.getGameState()
      };
    }
  }

  useHint() {
    if (this.status !== 'playing' || !this.currentProverb) {
      return { success: false, reason: 'inactive' };
    }
    if (this.hintsUsedThisProverb >= 1) {
      return { success: false, reason: 'limit_reached' };
    }

    this.hintsUsedThisProverb++;
    return {
      success: true,
      hint: this.currentProverb.hint,
      meaning: this.currentProverb.meaning,
      category: this.currentProverb.category,
      culture: this.currentProverb.culture
    };
  }

  _checkWinCondition() {
    if (!this.currentProverb) return false;
    for (const char of this.currentProverb.phrase) {
      if (HangmanEngine.isPunctuation(char)) continue;
      const norm = HangmanEngine.normalizeChar(char);
      if (!this.guessedLetters.has(norm)) {
        return false;
      }
    }
    return true;
  }

  getDisplayTokens() {
    if (!this.currentProverb) return [];

    const words = this.currentProverb.phrase.split(' ');
    return words.map(word => {
      const letters = Array.from(word).map(char => {
        const isPunct = HangmanEngine.isPunctuation(char);
        const norm = HangmanEngine.normalizeChar(char);
        const isRevealed = isPunct || this.guessedLetters.has(norm) || this.status === 'lost';
        return {
          char,
          norm,
          isPunct,
          isRevealed
        };
      });
      return { word, letters };
    });
  }

  getGameState() {
    return {
      index: this.currentProverbIndex,
      totalProverbs: this.proverbs.length,
      proverb: this.currentProverb,
      tokens: this.getDisplayTokens(),
      maxLives: this.maxLives,
      remainingLives: this.remainingLives,
      wrongCount: this.wrongLetters.size,
      guessedLetters: Array.from(this.guessedLetters),
      wrongLetters: Array.from(this.wrongLetters),
      hintsUsed: this.hintsUsedThisProverb,
      status: this.status
    };
  }
}
