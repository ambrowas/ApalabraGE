/**
 * ApalabraGE - Gestor de Perfil, Estadísticas y Sincronización Firebase
 */

import { db } from '../firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'apalabrage_user_profile';

export class ProfileManager {
  constructor() {
    this.userId = this._getOrCreateUserId();
    this.profile = this._loadLocalProfile();
  }

  _getOrCreateUserId() {
    let id = localStorage.getItem('apalabrage_user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('apalabrage_user_id', id);
    }
    return id;
  }

  _loadLocalProfile() {
    const defaultProfile = {
      name: 'Explorador Guineano',
      avatar: '🌳',
      city: 'Malabo',
      photoUrl: null,
      title: 'Guardián de la Ceiba',
      levelsCompleted: 0,
      wordsFound: 0,
      stars: 0,
      streakDays: 1,
      fastestLevelTime: null,
      bestTimes: {},
      timeAttackHighScore: 0,
      timeAttackLevelsCleared: 0,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      categoryProgress: {
        gastronomia: 0,
        geografia: 0,
        cultura: 0,
        modismos: 0
      },
      completedLevels: [],
      discoveredWords: [],
      achievements: [
        { id: 'first_word', title: 'Primera Palabra', desc: 'Encontraste tu primer término', icon: '🌱', unlocked: false },
        { id: 'master_gastro', title: 'Cocinero de Pepesup', desc: 'Descubre los sabores tradicionales', icon: '🍲', unlocked: false },
        { id: 'explorer_bioko', title: 'Cartógrafo de Bioko', desc: 'Domina los lugares del país', icon: '🗺️', unlocked: false },
        { id: 'mvet_player', title: 'Trovador del Mvet', desc: 'Conoce los símbolos ancestrales', icon: '🥁', unlocked: false },
        { id: 'street_slang', title: 'Palaveras de Bata', desc: 'Aprende los modismos populares', icon: '💬', unlocked: false },
        { id: 'academico_aegle', title: 'Académico de la AEGLE', desc: 'Máximo galardón honorífico de la Academia Ecuatoguineana de la Lengua Española', icon: '🎓', unlocked: false }
      ]
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.achievements && !parsed.achievements.some(a => a.id === 'academico_aegle')) {
          parsed.achievements.push({
            id: 'academico_aegle',
            title: 'Académico de la AEGLE',
            desc: 'Máximo galardón honorífico de la Academia Ecuatoguineana de la Lengua Española',
            icon: '🎓',
            unlocked: false
          });
        }
        return { ...defaultProfile, ...parsed };
      }
    } catch (e) {
      console.warn('Error al leer perfil local:', e);
    }
    return defaultProfile;
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      this.syncToFirebase();
    } catch (e) {
      console.warn('Error al guardar perfil:', e);
    }
  }

  async syncToFirebase() {
    try {
      if (!this.userId) return;
      const userDocRef = doc(db, 'users', this.userId);
      await setDoc(userDocRef, {
        id: this.userId,
        ...this.profile,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('☁️ Perfil sincronizado con Firebase Firestore');
    } catch (error) {
      console.warn('Sincronización Firestore en segundo plano:', error.message);
    }
  }

  async loadFromFirebase() {
    try {
      if (!this.userId) return;
      const userDocRef = doc(db, 'users', this.userId);
      const snapshot = await getDoc(userDocRef);
      if (snapshot.exists()) {
        this.profile = { ...this.profile, ...snapshot.data() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      }
    } catch (e) {
      console.warn('Fallo al cargar perfil de Firebase:', e.message);
    }
  }

  recordWordFound(word, categoryId) {
    if (!this.profile.discoveredWords.includes(word)) {
      this.profile.discoveredWords.push(word);
      this.profile.wordsFound++;
      this._checkAchievements();
      this.save();
    }
  }

  recordLevelCompleted(levelId, categoryId, stars = 3) {
    if (!this.profile.completedLevels.includes(levelId)) {
      this.profile.completedLevels.push(levelId);
      this.profile.levelsCompleted++;
      this.profile.stars += stars;

      if (!this.profile.categoryProgress[categoryId]) {
        this.profile.categoryProgress[categoryId] = 0;
      }
      this.profile.categoryProgress[categoryId]++;

      this._updatePlayerTitle();
      this._checkAchievements();
      this.save();
    }
  }

  recordProverbWon(proverbId, stars = 3) {
    if (!this.profile.proverbsSolved) {
      this.profile.proverbsSolved = [];
    }
    if (!this.profile.proverbsSolved.includes(proverbId)) {
      this.profile.proverbsSolved.push(proverbId);
      this.profile.stars = (this.profile.stars || 0) + stars;
      this._updatePlayerTitle();
      this._checkAchievements();
      this.save();
    }
  }

  setSponsorshipEnabled(enabled) {
    this.sponsorshipEnabled = !!enabled;
    this._updatePlayerTitle();
    this._checkAchievements();
    this.save();
  }

  _updatePlayerTitle() {
    const total = this.profile.levelsCompleted;
    const isAegle = this.sponsorshipEnabled !== false;
    if (total >= 15) this.profile.title = isAegle ? 'Académico de la AEGLE 🎓' : 'Gran Sabio de Guinea Ecuatorial 👑';
    else if (total >= 10) this.profile.title = 'Sabio de Guinea Ecuatorial 👑';
    else if (total >= 6) this.profile.title = 'Erudito de Río Muni 🏛️';
    else if (total >= 3) this.profile.title = 'Caminante de Bioko 🌋';
    else this.profile.title = 'Guardián de la Ceiba 🌳';
  }

  _checkAchievements() {
    const p = this.profile;
    const isAegle = this.sponsorshipEnabled !== false;
    p.achievements.forEach(ach => {
      if (ach.id === 'first_word' && p.wordsFound >= 1) ach.unlocked = true;
      if (ach.id === 'master_gastro' && (p.categoryProgress['gastronomia'] || 0) >= 2) ach.unlocked = true;
      if (ach.id === 'explorer_bioko' && (p.categoryProgress['geografia'] || 0) >= 2) ach.unlocked = true;
      if (ach.id === 'mvet_player' && (p.categoryProgress['cultura'] || 0) >= 2) ach.unlocked = true;
      if (ach.id === 'street_slang' && (p.categoryProgress['modismos'] || 0) >= 1) ach.unlocked = true;
      if (ach.id === 'academico_aegle') {
        ach.title = isAegle ? 'Académico de la AEGLE' : 'Gran Sabio Cultural';
        ach.desc = isAegle ? 'Máximo galardón honorífico de la Academia Ecuatoguineana de la Lengua Española' : 'Máximo galardón honorífico de sabiduría cultural de Guinea Ecuatorial';
        if (p.levelsCompleted >= 15 || p.wordsFound >= 50) ach.unlocked = true;
      }
    });
  }

  updateName(newName) {
    if (newName && newName.trim()) {
      this.profile.name = newName.trim();
      this.save();
    }
  }

  updateAvatar(newAvatar) {
    this.profile.avatar = newAvatar;
    this.save();
  }

  updateCity(newCity) {
    if (newCity && newCity.trim()) {
      this.profile.city = newCity.trim();
      this.save();
    }
  }

  recordLevelTime(levelId, seconds) {
    if (!this.profile.bestTimes) {
      this.profile.bestTimes = {};
    }
    const currentBest = this.profile.bestTimes[levelId];
    let isNewRecord = false;
    if (!currentBest || seconds < currentBest) {
      this.profile.bestTimes[levelId] = seconds;
      isNewRecord = true;
    }

    if (!this.profile.fastestLevelTime || seconds < this.profile.fastestLevelTime) {
      this.profile.fastestLevelTime = seconds;
    }

    this.save();
    return isNewRecord;
  }

  recordTimeAttackScore(score, levelsCleared = 1) {
    if (!this.profile.timeAttackHighScore || score > this.profile.timeAttackHighScore) {
      this.profile.timeAttackHighScore = score;
    }
    this.profile.timeAttackLevelsCleared = (this.profile.timeAttackLevelsCleared || 0) + levelsCleared;
    this.save();
  }
}

export const profileManager = new ProfileManager();
