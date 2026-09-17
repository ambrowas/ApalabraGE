/**
 * ApalabraGE - Controlador Principal Multi-Pantalla y Ciclo de Juego
 * Maneja Splash, Home, Game, Perfil y Sincronización Firebase
 */

import levelsData from './data/levels.json';
import { GridEngine } from './core/gridEngine.js';
import { sound } from './core/soundEngine.js';
import { profileManager } from './core/profileManager.js';
import { WORLD_CITIES } from './data/diasporaCities.js';
import { db } from './firebase.js';
import { collection, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { proverbsData } from './data/proverbs.js';
import { HangmanEngine } from './core/hangmanEngine.js';

class ApalabraApp {
  constructor() {
    this.allLevels = [];
    this.categories = levelsData.categories;
    this.currentLevelIndex = 0;
    this.currentLevel = null;
    this.currentScreen = 'screen-splash';

    // Estado Reactivo del Tablero
    this.grid = [];
    this.cols = 4;
    this.rows = 5;
    this.targetWords = [];
    this.selectedTiles = [];
    this.isDragging = false;
    this.isAnimating = false;
    this.hintsUsedThisLevel = 0;

    // Modo de Juego y Cronómetro
    this.gameMode = 'classic'; // 'classic' o 'timeattack'
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.timeAttackTotalSeconds = 75;
    this.timeAttackRemainingSeconds = 75;

    // Estado del Ranking
    this.rankingFilter = 'stars'; // 'stars', 'timeattack', 'words'
    this.rankingScreen = 'podium'; // 'podium', 'table'
    this.cachedRankingUsers = [];

    // Modalidad El Refranero Africano (Ahorcado)
    this.hangmanEngine = new HangmanEngine(proverbsData);
    this.currentProverbIndex = 0;
    this.previousScreen = 'hub';

    // Elementos del DOM
    this.dom = {
      // Pantallas
      screens: {
        splash: document.getElementById('screen-splash'),
        hub: document.getElementById('screen-hub'),
        home: document.getElementById('screen-home'),
        game: document.getElementById('screen-game'),
        profile: document.getElementById('screen-profile'),
        hangman: document.getElementById('screen-hangman')
      },
      bottomNav: document.getElementById('bottom-nav'),
      navBtns: {
        home: document.getElementById('nav-btn-home'),
        game: document.getElementById('nav-btn-game'),
        profile: document.getElementById('nav-btn-profile')
      },

      // Splash
      splashFill: document.getElementById('splash-fill'),
      splashStatus: document.getElementById('splash-status'),
      btnSplashStart: document.getElementById('btn-splash-start'),

      // Hub (Selector de Modalidades)
      hubAvatar: document.getElementById('hub-avatar'),
      hubUsername: document.getElementById('hub-username'),
      hubStarsCount: document.getElementById('hub-stars-count'),
      btnHubProfile: document.getElementById('btn-hub-profile'),
      btnHubRanking: document.getElementById('btn-hub-ranking'),
      btnHubSound: document.getElementById('btn-hub-sound'),
      hubTriviaText: document.getElementById('hub-trivia-text'),
      btnHubApalabrage: document.getElementById('btn-hub-apalabrage'),
      btnHubHangman: document.getElementById('btn-hub-hangman'),
      cardModeApalabrage: document.getElementById('card-mode-apalabrage'),
      cardModeHangman: document.getElementById('card-mode-hangman'),

      // Home (ApalabraGE Selección)
      btnHomeBack: document.getElementById('btn-home-back'),
      homeAvatar: document.getElementById('home-avatar'),
      homeUsername: document.getElementById('home-username'),
      homeStarsCount: document.getElementById('home-stars-count'),
      btnHomeRanking: document.getElementById('btn-home-ranking'),
      btnHomeSound: document.getElementById('btn-home-sound'),
      btnHomeProfile: document.getElementById('btn-home-profile'),
      btnModeClassic: document.getElementById('btn-mode-classic'),
      btnModeTimeattack: document.getElementById('btn-mode-timeattack'),
      heroCard: document.getElementById('hero-card'),
      heroModeBadge: document.getElementById('hero-mode-badge'),
      homeCurrentCategory: document.getElementById('home-current-category'),
      homeCurrentLevelTitle: document.getElementById('home-current-level-title'),
      homeCurrentClue: document.getElementById('home-current-clue'),
      btnHeroPlay: document.getElementById('btn-hero-play'),
      homeCategoriesList: document.getElementById('home-categories-list'),
      dailyTriviaText: document.getElementById('daily-trivia-text'),

      // Hangman (El Refranero Africano)
      btnHangmanBack: document.getElementById('btn-hangman-back'),
      hangmanOriginLabel: document.getElementById('hangman-origin-label'),
      hangmanStarsCount: document.getElementById('hangman-stars-count'),
      hangmanLivesIcons: document.getElementById('hangman-lives-icons'),
      hangmanProverbNum: document.getElementById('hangman-proverb-num'),
      hangmanCategoryBadge: document.getElementById('hangman-category-badge'),
      hangmanPhraseGrid: document.getElementById('hangman-phrase-grid'),
      btnHangmanHint: document.getElementById('btn-hangman-hint'),
      hangmanHintTextBox: document.getElementById('hangman-hint-text-box'),
      hangmanHintMessage: document.getElementById('hangman-hint-message'),
      hangmanKeyboardWrap: document.getElementById('hangman-keyboard-wrap'),

      // Hangman Result Modal
      modalHangmanResult: document.getElementById('modal-hangman-result'),
      hmResBadge: document.getElementById('hm-res-badge'),
      hmResIcon: document.getElementById('hm-res-icon'),
      hmResTitle: document.getElementById('hm-res-title'),
      hmResPhrase: document.getElementById('hm-res-phrase'),
      hmResNative: document.getElementById('hm-res-native'),
      hmResCulture: document.getElementById('hm-res-culture'),
      hmResMeaning: document.getElementById('hm-res-meaning'),
      hmResStars: document.getElementById('hm-res-stars'),
      btnHmNext: document.getElementById('btn-hm-next'),
      btnHmExit: document.getElementById('btn-hm-exit'),

      // Game Header y Cronómetro
      btnGameBack: document.getElementById('btn-game-back'),
      levelBadge: document.getElementById('level-badge'),
      gameTimerBadge: document.getElementById('game-timer-badge'),
      gameTimerIcon: document.getElementById('game-timer-icon'),
      gameTimerText: document.getElementById('game-timer-text'),
      timerBonusPill: document.getElementById('timer-bonus-pill'),
      timeattackBarWrap: document.getElementById('timeattack-bar-wrap'),
      timeattackBarFill: document.getElementById('timeattack-bar-fill'),
      categoryTag: document.getElementById('category-tag'),
      clueText: document.getElementById('clue-text'),
      targetsBar: document.getElementById('targets-bar'),
      wordBubble: document.getElementById('word-bubble'),
      currentWordText: document.getElementById('current-word-text'),
      boardWrapper: document.getElementById('board-wrapper'),
      boardFrame: document.getElementById('board-frame'),
      gridContainer: document.getElementById('grid-container'),
      dragPolyline: document.getElementById('drag-polyline'),
      btnSound: document.getElementById('btn-sound'),
      btnLevels: document.getElementById('btn-levels'),
      btnHint: document.getElementById('btn-hint'),
      btnShake: document.getElementById('btn-shake'),
      btnGlossary: document.getElementById('btn-glossary'),
      btnReset: document.getElementById('btn-reset'),

      // Profile
      btnProfileBack: document.getElementById('btn-profile-back'),
      btnProfileSync: document.getElementById('btn-profile-sync'),
      profileAvatarDisplay: document.getElementById('profile-avatar-display'),
      btnChangeAvatar: document.getElementById('btn-change-avatar'),
      avatarPicker: document.getElementById('avatar-picker'),
      avatarFileInput: document.getElementById('avatar-file-input'),
      btnTriggerUpload: document.getElementById('btn-trigger-upload'),
      inputProfileName: document.getElementById('input-profile-name'),
      btnSaveName: document.getElementById('btn-save-name'),
      profileTitleDisplay: document.getElementById('profile-title-display'),
      inputProfileCity: document.getElementById('input-profile-city'),
      btnClearCity: document.getElementById('btn-clear-city'),
      citySuggestionsDropdown: document.getElementById('city-suggestions-dropdown'),
      kpiLevels: document.getElementById('kpi-levels'),
      kpiWords: document.getElementById('kpi-words'),
      kpiStars: document.getElementById('kpi-stars'),
      kpiSpeed: document.getElementById('kpi-speed'),
      kpiStreak: document.getElementById('kpi-streak'),
      cultureProgressBars: document.getElementById('culture-progress-bars'),
      profileAchievementsList: document.getElementById('profile-achievements-list'),

      // Modales
      victoryModal: document.getElementById('victory-modal'),
      victorySummary: document.getElementById('victory-summary'),
      victoryTimePill: document.getElementById('victory-time-pill'),
      victoryTimeText: document.getElementById('victory-time-text'),
      victoryRecordBadge: document.getElementById('victory-record-badge'),
      btnNextLevel: document.getElementById('btn-next-level'),
      glossaryModal: document.getElementById('glossary-modal'),
      glossaryContent: document.getElementById('glossary-content'),
      btnCloseGlossary: document.getElementById('btn-close-glossary'),
      levelsModal: document.getElementById('levels-modal'),
      categoriesContainer: document.getElementById('categories-container'),
      btnCloseLevels: document.getElementById('btn-close-levels'),

      // Ranking Modal
      rankingModal: document.getElementById('ranking-modal'),
      rankingModalTitle: document.getElementById('ranking-modal-title'),
      btnCloseRanking: document.getElementById('btn-close-ranking'),
      btnScreenPodium: document.getElementById('btn-screen-podium'),
      btnScreenTable: document.getElementById('btn-screen-table'),
      rankingViewPodium: document.getElementById('ranking-view-podium'),
      rankingViewTable: document.getElementById('ranking-view-table'),
      btnGotoTable: document.getElementById('btn-goto-table'),
      rankingPodium: document.getElementById('ranking-podium'),
      rankingPlayersList: document.getElementById('ranking-players-list'),
      rankingCurrentUserCard: document.getElementById('ranking-current-user-card'),

      // Modal Perfil de Jugador (desde Ranking)
      modalPlayerProfile: document.getElementById('modal-player-profile'),
      btnClosePlayerProfile: document.getElementById('btn-close-player-profile'),
      ppModalTag: document.getElementById('pp-modal-tag'),
      ppAvatarDisplay: document.getElementById('pp-avatar-display'),
      ppNameDisplay: document.getElementById('pp-name-display'),
      ppTitleDisplay: document.getElementById('pp-title-display'),
      ppCityDisplay: document.getElementById('pp-city-display'),
      ppRankDisplay: document.getElementById('pp-rank-display'),
      ppStarsVal: document.getElementById('pp-stars-val'),
      ppLevelsVal: document.getElementById('pp-levels-val'),
      ppWordsVal: document.getElementById('pp-words-val'),
      ppSpeedVal: document.getElementById('pp-speed-val'),
      btnPlayerProfileAction: document.getElementById('btn-player-profile-action'),

      // Timeout Modal (Contrarreloj)
      timeoutModal: document.getElementById('timeout-modal'),
      timeoutWordsCount: document.getElementById('timeout-words-count'),
      btnRetryTimeout: document.getElementById('btn-retry-timeout'),
      btnBackHomeTimeout: document.getElementById('btn-back-home-timeout')
    };

    this.init();
  }

  async init() {
    this.initSponsorship();
    this._loadCachedContent();
    this._flattenLevels();
    this._bindEvents();
    this._runSplashSequence();
  }

  /* ================= CONFIGURACIÓN Y CONMUTACIÓN DE PATROCINIO (AEGLE) ================= */

  initSponsorship() {
    let config = {
      enabled: true,
      sponsorName: "Academia Ecuatoguineana de la Lengua Española",
      sponsorShort: "AEGLE",
      website: "https://www.aegle.gq/",
      logoUrl: "/AEGLE.png"
    };

    try {
      const saved = localStorage.getItem('apalabrage_sponsorship');
      if (saved) {
        config = { ...config, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error al leer patrocinio local:', e);
    }

    this.applySponsorshipConfig(config);

    // Intentar leer de Firestore de forma asíncrona
    try {
      getDoc(doc(db, 'settings', 'sponsorship')).then((snap) => {
        if (snap.exists()) {
          this.applySponsorshipConfig(snap.data());
        }
      }).catch(err => console.warn('Patrocinio Firestore no disponible offline:', err));
    } catch (e) {}
  }

  applySponsorshipConfig(config) {
    if (!config) return;
    this.sponsorshipConfig = {
      enabled: config.enabled !== false,
      sponsorName: config.sponsorName || "Academia Ecuatoguineana de la Lengua Española",
      sponsorShort: config.sponsorShort || "AEGLE",
      website: config.website || "https://www.aegle.gq/",
      logoUrl: config.logoUrl || "/AEGLE.png"
    };

    try {
      localStorage.setItem('apalabrage_sponsorship', JSON.stringify(this.sponsorshipConfig));
    } catch (e) {}

    const isEnabled = this.sponsorshipConfig.enabled;

    // 1. Pantalla Splash (Logo y mención institucional)
    const splashSponsorBox = document.getElementById('splash-sponsor-box');
    if (splashSponsorBox) {
      splashSponsorBox.style.display = isEnabled ? 'flex' : 'none';
    }
    const splashSponsorTitle = document.getElementById('splash-sponsor-title');
    if (splashSponsorTitle) {
      splashSponsorTitle.innerHTML = `Patrocinado por la <a href="${this.sponsorshipConfig.website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">${this.sponsorshipConfig.sponsorName}</a>`;
    }
    const splashSponsorImg = document.getElementById('splash-sponsor-img');
    if (splashSponsorImg) {
      splashSponsorImg.src = this.sponsorshipConfig.logoUrl;
    }
    const splashSponsorLogoLink = document.getElementById('splash-sponsor-logo-link');
    if (splashSponsorLogoLink) {
      splashSponsorLogoLink.href = this.sponsorshipConfig.website;
    }
    const splashSponsorSub = document.getElementById('splash-sponsor-sub');
    if (splashSponsorSub) {
      splashSponsorSub.innerHTML = `Web Oficial: <a href="${this.sponsorshipConfig.website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">${this.sponsorshipConfig.sponsorShort}</a>`;
    }

    // 2. Glosario Modal (Icono y Títulos)
    const glossaryLogo = document.getElementById('glossary-sponsor-logo');
    const glossaryTitle = document.getElementById('glossary-modal-title');
    const glossarySubtitle = document.getElementById('glossary-modal-subtitle');

    if (glossaryLogo) {
      glossaryLogo.style.display = isEnabled ? 'inline-block' : 'none';
      glossaryLogo.src = this.sponsorshipConfig.logoUrl;
    }
    if (glossaryTitle) {
      glossaryTitle.innerHTML = isEnabled 
        ? `Glosario de la <a href="${this.sponsorshipConfig.website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">${this.sponsorshipConfig.sponsorShort}</a>` 
        : '📖 Glosario del Reto';
    }
    if (glossarySubtitle) {
      glossarySubtitle.innerHTML = isEnabled 
        ? `Significados, raíces y patrimonio léxico avalados por la <a href="${this.sponsorshipConfig.website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">${this.sponsorshipConfig.sponsorName}</a>:`
        : 'Significados, raíces y expresiones autóctonas de Guinea Ecuatorial:';
    }

    // 3. Salón de Honor y Ranking Top 50
    const rankingTitle = document.getElementById('ranking-modal-title');
    const rankingSubtitle = document.getElementById('ranking-modal-subtitle');
    const rankingTabPodium = document.getElementById('ranking-tab-podium-label');
    const rankingTabTable = document.getElementById('ranking-tab-table-label');
    const btnGotoTable = document.getElementById('btn-goto-table-label');

    if (rankingTitle) {
      rankingTitle.innerHTML = isEnabled 
        ? `🏆 Salón de Honor de la <a href="${this.sponsorshipConfig.website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">${this.sponsorshipConfig.sponsorShort}</a>` 
        : '🏆 Salón de Honor GE';
    }
    if (rankingSubtitle) {
      rankingSubtitle.innerHTML = isEnabled 
        ? `Ranking oficial de sabiduría y cultura lingüística avalado por la <a href="${this.sponsorshipConfig.website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">${this.sponsorshipConfig.sponsorShort}</a>` 
        : 'Ranking oficial de sabiduría y cultura de Guinea Ecuatorial';
    }
    if (rankingTabPodium) {
      rankingTabPodium.textContent = '👑 Salón de Honor';
    }
    if (rankingTabTable) {
      rankingTabTable.textContent = '📊 Tabla Top 50';
    }
    if (btnGotoTable) {
      btnGotoTable.innerHTML = isEnabled 
        ? `Ver Tabla Top 50 <a href="${this.sponsorshipConfig.website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link" onclick="event.stopPropagation()">${this.sponsorshipConfig.sponsorShort}</a> Completa ➔` 
        : 'Ver Tabla Top 50 Global Completa ➔';
    }

    // 4. Perfil del Jugador y Máximo Reconocimiento
    if (profileManager && profileManager.setSponsorshipEnabled) {
      profileManager.setSponsorshipEnabled(isEnabled);
    }

    // 5. Header de las Pantallas (Micro-Elemento de Patrocinio)
    const allHeaderSponsorLinks = document.querySelectorAll('.home-header-aegle-link');
    allHeaderSponsorLinks.forEach(link => {
      link.href = this.sponsorshipConfig.website || "https://www.aegle.gq/";
      link.textContent = (this.sponsorshipConfig.sponsorName || "Academia Ecuatoguineana de la Lengua Española").toUpperCase();
    });
  }

  _loadCachedContent() {
    try {
      const cached = localStorage.getItem('apalabrage_cached_categories');
      if (cached) {
        const parsed = JSON.parse(cached);
        let cachedLevelsCount = 0;
        if (Array.isArray(parsed)) {
          parsed.forEach(c => cachedLevelsCount += (c.levels ? c.levels.length : 0));
        }
        let localLevelsCount = 0;
        (levelsData.categories || []).forEach(c => localLevelsCount += (c.levels ? c.levels.length : 0));

        // Usar caché si contiene al menos tantos niveles como el catálogo empaquetado (71 niveles)
        if (Array.isArray(parsed) && parsed.length > 0 && cachedLevelsCount >= localLevelsCount) {
          this.categories = parsed;
          console.log(`💾 Cargadas ${parsed.length} categorías desde caché local offline (${cachedLevelsCount} niveles).`);
        } else {
          this.categories = (levelsData.categories || []);
          localStorage.setItem('apalabrage_cached_categories', JSON.stringify(this.categories));
          console.log(`📦 Actualizado catálogo offline a ${localLevelsCount} niveles culturales del libro.`);
        }
      } else {
        this.categories = (levelsData.categories || []);
      }
    } catch (e) {
      this.categories = (levelsData.categories || []);
    }
  }

  _flattenLevels() {
    this.allLevels = [];
    this.categories.forEach(cat => {
      (cat.levels || []).forEach(lvl => {
        this.allLevels.push({
          ...lvl,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon
        });
      });
    });
  }

  /* ================= SECUENCIA SPLASH SCREEN Y SINCRONIZACIÓN ================= */

  async _runSplashSequence() {
    let progress = 15;
    const interval = setInterval(() => {
      progress += 18;
      if (progress > 90) clearInterval(interval);
      if (this.dom.splashFill) {
        this.dom.splashFill.style.width = `${Math.min(progress, 90)}%`;
      }
    }, 100);

    const transitionToHome = () => {
      if (this.splashDismissed) return;
      this.splashDismissed = true;
      const splash = document.getElementById('screen-splash');
      if (splash) {
        splash.style.transition = 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)';
        splash.style.opacity = '0';
        splash.style.transform = 'scale(1.03)';
        splash.style.pointerEvents = 'none';
        setTimeout(() => {
          this.switchScreen('hub');
          splash.classList.remove('active');
        }, 400);
      } else {
        this.switchScreen('hub');
      }
    };

    // Permitir continuar tocando la pantalla en cualquier momento
    const splashView = document.getElementById('screen-splash');
    if (splashView) {
      splashView.addEventListener('click', () => {
        transitionToHome();
      });
    }

    try {
      // 1. Sincronizar perfil de usuario
      await profileManager.loadFromFirebase();

      // 2. Sincronizar categorías y niveles culturales desde Firebase Firestore
      await this.loadCulturalContentFromFirebase();

      // 3. Activar listener en tiempo real para cambios hechos en el Dashboard
      this.setupRealtimeSync();
    } catch (e) {
      console.warn('Conexión inicial Firebase:', e);
    } finally {
      clearInterval(interval);
      if (this.dom.splashFill) this.dom.splashFill.style.width = '100%';
      if (this.dom.splashStatus) this.dom.splashStatus.textContent = `¡${this.allLevels.length} retos culturales listos! 🇬🇶`;

      // Transición automática suave y natural hacia el menú principal
      setTimeout(() => {
        transitionToHome();
      }, 700);
    }
  }

  async loadCulturalContentFromFirebase() {
    try {
      // Cargar categorías de Firestore
      const catSnap = await getDocs(collection(db, 'categories'));
      let firestoreCats = [];
      if (!catSnap.empty) {
        firestoreCats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), levels: [] }));
      } else {
        firestoreCats = (levelsData.categories || []).map(c => ({ ...c, levels: [] }));
      }

      // Cargar niveles de Firestore
      const lvlSnap = await getDocs(collection(db, 'levels'));
      if (!lvlSnap.empty) {
        const firestoreLevels = lvlSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const catMap = new Map();
        firestoreCats.forEach(c => catMap.set(c.id, { ...c, levels: [] }));

        firestoreLevels.forEach(lvl => {
          const catId = lvl.categoryId || 'historia_pioneros';
          if (!catMap.has(catId)) {
            catMap.set(catId, {
              id: catId,
              name: lvl.categoryName || 'Cultura General',
              icon: lvl.categoryIcon || '🇬🇶',
              description: 'Niveles culturales de Guinea Ecuatorial',
              levels: []
            });
          }
          catMap.get(catId).levels.push(lvl);
        });

        const newCategories = Array.from(catMap.values()).filter(c => c.levels && c.levels.length > 0);
        if (newCategories.length > 0) {
          this.categories = newCategories;
          this._flattenLevels();
          localStorage.setItem('apalabrage_cached_categories', JSON.stringify(this.categories));
          console.log(`📡 Sincronización exitosa: ${this.allLevels.length} niveles en ${this.categories.length} categorías.`);
          return true;
        }
      }
    } catch (err) {
      console.warn('Error sincronizando con Firestore, usando datos locales:', err);
      this.categories = (levelsData.categories || []);
      this._flattenLevels();
    }
    return false;
  }

  setupRealtimeSync() {
    try {
      onSnapshot(collection(db, 'levels'), async (snapshot) => {
        if (!snapshot.empty) {
          console.log('🔄 Actualización detectada en Firestore desde Dashboard!');
          const updated = await this.loadCulturalContentFromFirebase();
          if (updated) {
            this.renderHomeCategories();
            this.renderCategoriesModal();
          }
        }
      }, (err) => console.warn('Snapshot listener error:', err));

      onSnapshot(doc(db, 'settings', 'sponsorship'), (snap) => {
        if (snap.exists()) {
          console.log('🤝 Cambio en configuración de patrocinio en Firestore:', snap.data());
          this.applySponsorshipConfig(snap.data());
        }
      }, (err) => console.warn('Snapshot listener sponsorship error:', err));
    } catch (e) {}
  }

  /* ================= NAVEGACIÓN Y PANTALLAS ================= */

  switchScreen(screenKey) {
    this.currentScreen = screenKey;

    if (screenKey !== 'game') {
      this.stopTimer();
    }

    Object.values(this.dom.screens).forEach(screen => {
      if (screen) screen.classList.remove('active');
    });

    const targetScreen = this.dom.screens[screenKey];
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    if (this.dom.bottomNav) {
      this.dom.bottomNav.style.display = 'none';
    }

    // Acciones al entrar a cada pantalla
    if (screenKey === 'hub') {
      this.renderHubScreen();
    } else if (screenKey === 'home') {
      this.renderHomeScreen();
    } else if (screenKey === 'profile') {
      this.renderProfileScreen();
    } else if (screenKey === 'hangman') {
      this.renderHangmanScreen();
    }
  }

  /* ================= EVENTOS Y LISTENERS ================= */

  _bindEvents() {
    // Splash Start -> va al Hub de Selección
    this.dom.btnSplashStart.addEventListener('click', () => {
      sound.playSparkle();
      this.switchScreen('hub');
    });

    // Eventos del Hub Principal
    if (this.dom.btnHubApalabrage) {
      this.dom.btnHubApalabrage.addEventListener('click', () => {
        sound.playSparkle();
        this.switchScreen('home');
      });
    }
    if (this.dom.cardModeApalabrage) {
      this.dom.cardModeApalabrage.addEventListener('click', (e) => {
        if (e.target !== this.dom.btnHubApalabrage) {
          sound.playSparkle();
          this.switchScreen('home');
        }
      });
    }
    if (this.dom.btnHubHangman) {
      this.dom.btnHubHangman.addEventListener('click', () => {
        sound.playSparkle();
        this.switchScreen('hangman');
      });
    }
    if (this.dom.cardModeHangman) {
      this.dom.cardModeHangman.addEventListener('click', (e) => {
        if (e.target !== this.dom.btnHubHangman) {
          sound.playSparkle();
          this.switchScreen('hangman');
        }
      });
    }
    if (this.dom.btnHubProfile) {
      this.dom.btnHubProfile.addEventListener('click', () => {
        sound.playSparkle();
        this.previousScreen = 'hub';
        this.switchScreen('profile');
      });
    }
    if (this.dom.btnHubRanking) {
      this.dom.btnHubRanking.addEventListener('click', () => {
        sound.playSparkle();
        this.openRankingModal('stars');
      });
    }

    // Botones de vuelta al Hub
    if (this.dom.btnHomeBack) {
      this.dom.btnHomeBack.addEventListener('click', () => {
        sound.playSparkle();
        this.switchScreen('hub');
      });
    }
    if (this.dom.btnHangmanBack) {
      this.dom.btnHangmanBack.addEventListener('click', () => {
        sound.playSparkle();
        this.switchScreen('hub');
      });
    }

    // Hangman: Pista Cultural y Modales
    if (this.dom.btnHangmanHint) {
      this.dom.btnHangmanHint.addEventListener('click', () => {
        this.useHangmanHint();
      });
    }
    if (this.dom.btnHmNext) {
      this.dom.btnHmNext.addEventListener('click', () => {
        sound.playSparkle();
        this.closeHangmanModal();
        this.nextHangmanProverb();
      });
    }
    if (this.dom.btnHmExit) {
      this.dom.btnHmExit.addEventListener('click', () => {
        sound.playSparkle();
        this.closeHangmanModal();
        this.switchScreen('hub');
      });
    }

    // Barra de Navegación Inferior (si existiera)
    if (this.dom.navBtns?.home) this.dom.navBtns.home.addEventListener('click', () => this.switchScreen('home'));
    if (this.dom.navBtns?.game) this.dom.navBtns.game.addEventListener('click', () => {
      this.switchScreen('game');
      this.loadLevel(this.currentLevelIndex);
    });
    if (this.dom.navBtns?.profile) this.dom.navBtns.profile.addEventListener('click', () => this.switchScreen('profile'));

    // Botones de navegación
    this.dom.btnGameBack.addEventListener('click', () => this.switchScreen('home'));
    this.dom.btnProfileBack.addEventListener('click', () => this.switchScreen(this.previousScreen || 'hub'));
    this.dom.btnHomeProfile.addEventListener('click', () => {
      this.previousScreen = 'home';
      this.switchScreen('profile');
    });

    // Selector de Modo de Juego (Clásico vs Contrarreloj)
    if (this.dom.btnModeClassic && this.dom.btnModeTimeattack) {
      this.dom.btnModeClassic.addEventListener('click', () => {
        this.gameMode = 'classic';
        this.dom.btnModeClassic.classList.add('active');
        this.dom.btnModeTimeattack.classList.remove('active');
        if (this.dom.heroModeBadge) {
          this.dom.heroModeBadge.textContent = '🌿 Clásico';
          this.dom.heroModeBadge.classList.remove('timeattack');
        }
        sound.playSparkle();
      });

      this.dom.btnModeTimeattack.addEventListener('click', () => {
        this.gameMode = 'timeattack';
        this.dom.btnModeTimeattack.classList.add('active');
        this.dom.btnModeClassic.classList.remove('active');
        if (this.dom.heroModeBadge) {
          this.dom.heroModeBadge.textContent = '⚡ Contrarreloj';
          this.dom.heroModeBadge.classList.add('timeattack');
        }
        sound.playTileConnect(2);
      });
    }

    // Botón de Ranking en Pantalla Principal (Home)
    if (this.dom.btnHomeRanking) {
      this.dom.btnHomeRanking.addEventListener('click', () => {
        sound.playSparkle();
        this.openRankingModal('stars');
      });
    }

    // Modal de Ranking: Botón de Cerrar, Vistas y Pestañas
    if (this.dom.btnCloseRanking) {
      this.dom.btnCloseRanking.addEventListener('click', () => {
        if (this.dom.rankingModal) this.dom.rankingModal.classList.remove('active');
      });
    }

    if (this.dom.btnScreenPodium) {
      this.dom.btnScreenPodium.addEventListener('click', () => {
        sound.playSparkle();
        this.switchRankingScreen('podium');
      });
    }

    if (this.dom.btnScreenTable) {
      this.dom.btnScreenTable.addEventListener('click', () => {
        sound.playSparkle();
        this.switchRankingScreen('table');
      });
    }

    if (this.dom.btnGotoTable) {
      this.dom.btnGotoTable.addEventListener('click', () => {
        sound.playSparkle();
        this.switchRankingScreen('table');
      });
    }

    // Modal Perfil de Jugador (al pulsar en el ranking)
    if (this.dom.btnClosePlayerProfile) {
      this.dom.btnClosePlayerProfile.addEventListener('click', () => {
        if (this.dom.modalPlayerProfile) this.dom.modalPlayerProfile.classList.remove('active');
      });
    }

    if (this.dom.btnPlayerProfileAction) {
      this.dom.btnPlayerProfileAction.addEventListener('click', () => {
        if (this.activeProfileUser && this.activeProfileUser.id === profileManager.userId) {
          if (this.dom.modalPlayerProfile) this.dom.modalPlayerProfile.classList.remove('active');
          if (this.dom.rankingModal) this.dom.rankingModal.classList.remove('active');
          this.switchScreen('profile');
        } else {
          if (this.dom.modalPlayerProfile) this.dom.modalPlayerProfile.classList.remove('active');
        }
      });
    }

    // Modal de Timeout (Contrarreloj)
    if (this.dom.btnRetryTimeout) {
      this.dom.btnRetryTimeout.addEventListener('click', () => {
        if (this.dom.timeoutModal) this.dom.timeoutModal.classList.remove('active');
        this.loadLevel(this.currentLevelIndex);
      });
    }

    if (this.dom.btnBackHomeTimeout) {
      this.dom.btnBackHomeTimeout.addEventListener('click', () => {
        if (this.dom.timeoutModal) this.dom.timeoutModal.classList.remove('active');
        this.switchScreen('home');
      });
    }

    // Perfil: Autocomplete de Ciudad / Diáspora
    if (this.dom.inputProfileCity && this.dom.citySuggestionsDropdown) {
      const renderSuggestions = (query = '') => {
        const q = query.trim().toLowerCase();
        let matches = [];
        if (!q) {
          // Mostrar las primeras ciudades de Guinea Ecuatorial y principales focos de la diáspora
          matches = WORLD_CITIES.slice(0, 12);
        } else {
          matches = WORLD_CITIES.filter(c => 
            c.name.toLowerCase().includes(q) || 
            c.region.toLowerCase().includes(q) || 
            c.country.toLowerCase().includes(q)
          ).slice(0, 16);
        }

        if (matches.length === 0) {
          this.dom.citySuggestionsDropdown.innerHTML = `
            <div style="padding: 10px; color: #94a3b8; font-size: 0.74rem; text-align: center;">
              Presiona Enter para guardar <strong>"${query}"</strong> como tu localidad personalizada
            </div>
          `;
          this.dom.citySuggestionsDropdown.style.display = 'block';
          return;
        }

        this.dom.citySuggestionsDropdown.innerHTML = '';
        matches.forEach(item => {
          const div = document.createElement('div');
          div.className = 'city-suggestion-item';
          div.innerHTML = `
            <div class="city-item-main">
              <span class="city-item-flag">${item.flag}</span>
              <span class="city-item-name">${item.name}</span>
              <span class="city-item-region">(${item.region})</span>
            </div>
            <span class="city-item-country-badge">${item.country}</span>
          `;
          div.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevenir blur prematuro
            this.dom.inputProfileCity.value = item.name;
            this.dom.citySuggestionsDropdown.style.display = 'none';
            profileManager.updateCity(item.name);
            sound.playSparkle();
          });
          this.dom.citySuggestionsDropdown.appendChild(div);
        });
        this.dom.citySuggestionsDropdown.style.display = 'block';
      };

      this.dom.inputProfileCity.addEventListener('focus', () => {
        renderSuggestions(this.dom.inputProfileCity.value);
      });

      this.dom.inputProfileCity.addEventListener('input', (e) => {
        renderSuggestions(e.target.value);
      });

      this.dom.inputProfileCity.addEventListener('blur', () => {
        setTimeout(() => {
          if (this.dom.citySuggestionsDropdown) {
            this.dom.citySuggestionsDropdown.style.display = 'none';
          }
          const val = this.dom.inputProfileCity.value.trim();
          if (val) {
            profileManager.updateCity(val);
          }
        }, 220);
      });

      this.dom.inputProfileCity.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = this.dom.inputProfileCity.value.trim();
          if (val) {
            profileManager.updateCity(val);
            sound.playSparkle();
            this.dom.citySuggestionsDropdown.style.display = 'none';
            this.dom.inputProfileCity.blur();
          }
        }
      });

      if (this.dom.btnClearCity) {
        this.dom.btnClearCity.addEventListener('click', () => {
          this.dom.inputProfileCity.value = '';
          this.dom.inputProfileCity.focus();
          renderSuggestions('');
        });
      }
    }

    // Sonido
    const toggleSoundAction = () => {
      const isMuted = sound.toggleMute();
      const icon = isMuted ? '🔇' : '🔊';
      if (this.dom.btnSound) this.dom.btnSound.textContent = icon;
      if (this.dom.btnHomeSound) this.dom.btnHomeSound.textContent = icon;
      if (this.dom.btnHubSound) this.dom.btnHubSound.textContent = icon;
    };
    if (this.dom.btnSound) this.dom.btnSound.addEventListener('click', toggleSoundAction);
    if (this.dom.btnHomeSound) this.dom.btnHomeSound.addEventListener('click', toggleSoundAction);
    if (this.dom.btnHubSound) this.dom.btnHubSound.addEventListener('click', toggleSoundAction);

    // Hero Play en Home
    this.dom.btnHeroPlay.addEventListener('click', () => {
      sound.playTileConnect(1);
      this.switchScreen('game');
      this.loadLevel(this.currentLevelIndex);
    });

    // Perfil: Guardar Nombre
    this.dom.btnSaveName.addEventListener('click', () => {
      const newName = this.dom.inputProfileName.value;
      profileManager.updateName(newName);
      sound.playSparkle();
      alert('¡Nombre actualizado!');
      this.renderHomeScreen();
    });

    // Perfil: Selección de Avatar
    document.querySelectorAll('.avatar-choice').forEach(choice => {
      choice.addEventListener('click', (e) => {
        const av = e.target.dataset.avatar;
        profileManager.updateAvatar(av);
        sound.playSparkle();
        this.renderProfileScreen();
        this.renderHomeScreen();
      });
    });

    // Perfil: Subida de Foto Propia
    if (this.dom.btnTriggerUpload && this.dom.avatarFileInput) {
      this.dom.btnTriggerUpload.addEventListener('click', () => {
        this.dom.avatarFileInput.click();
      });

      if (this.dom.btnChangeAvatar) {
        this.dom.btnChangeAvatar.addEventListener('click', () => {
          this.dom.avatarFileInput.click();
        });
      }

      this.dom.avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = 180;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            profileManager.updateAvatar(dataUrl);
            sound.playSparkle();
            this.renderProfileScreen();
            this.renderHomeScreen();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // Perfil: Sincronización Manual Firebase
    this.dom.btnProfileSync.addEventListener('click', async () => {
      sound.playSparkle();
      this.dom.btnProfileSync.textContent = '⏳';
      await profileManager.syncToFirebase();
      setTimeout(() => {
        this.dom.btnProfileSync.textContent = '☁️';
        alert('¡Estadísticas y progreso sincronizados con Firebase!');
      }, 500);
    });

    // Modales de Juego
    this.dom.btnGlossary.addEventListener('click', () => this.showGlossaryModal());
    this.dom.btnCloseGlossary.addEventListener('click', () => this.dom.glossaryModal.classList.remove('active'));

    this.dom.btnLevels.addEventListener('click', () => this.showLevelsModal());
    this.dom.btnCloseLevels.addEventListener('click', () => this.dom.levelsModal.classList.remove('active'));

    this.dom.btnNextLevel.addEventListener('click', () => {
      this.dom.victoryModal.classList.remove('active');
      const nextIndex = (this.currentLevelIndex + 1) % this.allLevels.length;
      this.loadLevel(nextIndex);
    });

    // Potenciadores en el juego
    this.dom.btnHint.addEventListener('click', () => this.useHint());
    this.dom.btnShake.addEventListener('click', () => this.shakeBoard());
    this.dom.btnReset.addEventListener('click', () => this.loadLevel(this.currentLevelIndex));

    // Arrastre Táctil / Ratón en el Tablero
    const board = this.dom.boardFrame;
    board.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerUp(e));

    window.addEventListener('resize', () => {
      if (this.selectedTiles.length > 0) this.updateSvgLine();
    });
  }

  setAvatarElement(el, avatarValue) {
    if (!el) return;
    if (avatarValue && (avatarValue.startsWith('data:image/') || avatarValue.startsWith('http'))) {
      el.innerHTML = `<img src="${avatarValue}" alt="Avatar" class="avatar-photo-img" />`;
    } else {
      el.innerHTML = '';
      el.textContent = avatarValue || '🌳';
    }
  }

  /* ================= RENDERIZADO DEL HUB PRINCIPAL ================= */

  renderHubScreen() {
    const prof = profileManager.profile;
    this.setAvatarElement(this.dom.hubAvatar, prof.avatar);
    if (this.dom.hubUsername) this.dom.hubUsername.textContent = prof.name;
    if (this.dom.hubStarsCount) this.dom.hubStarsCount.textContent = prof.stars;

    // Sincronizar icono de sonido
    const isMuted = sound.isMuted;
    const icon = isMuted ? '🔇' : '🔊';
    if (this.dom.btnHubSound) this.dom.btnHubSound.textContent = icon;
    if (this.dom.btnHomeSound) this.dom.btnHomeSound.textContent = icon;
    if (this.dom.btnSound) this.dom.btnSound.textContent = icon;

    // Curiosidad cultural en el Hub
    const trivias = [
      "En la tradición oral africana, los proverbios son llamados las «joyas de la sabiduría» transmitidas de generación en generación.",
      "El pueblo Fang sintetiza filosofía y justicia comunitaria a través de refranes recitados al son del Mvet.",
      "Entre los Bubi de la Isla de Bioko, los proverbios regulan el respeto a la naturaleza y el linaje ancestral.",
      "Los Ndowe ('hombres de la costa') transmiten el conocimiento de las mareas y la convivencia mediante adagios marineros.",
      "El concepto de Ubuntu ('soy porque somos') es el corazón moral de la sabiduría compartida en África."
    ];
    if (this.dom.hubTriviaText) {
      this.dom.hubTriviaText.innerHTML = `<strong>¿Sabías qué?</strong> ${trivias[Math.floor(Math.random() * trivias.length)]}`;
    }
  }

  /* ================= MODALIDAD: EL REFRANERO AFRICANO (AHORCADO) ================= */

  renderHangmanScreen() {
    if (!this.hangmanEngine.currentProverb) {
      this.startHangmanProverb(this.currentProverbIndex);
    } else {
      this.renderHangmanLivesAndTotem();
      this.renderHangmanBoard();
      this.renderHangmanKeyboard();
    }
    if (this.dom.hangmanStarsCount) {
      this.dom.hangmanStarsCount.textContent = profileManager.profile.stars;
    }
  }

  startHangmanProverb(index) {
    this.currentProverbIndex = index % proverbsData.length;
    const proverb = this.hangmanEngine.loadProverb(this.currentProverbIndex);

    // Actualizar encabezados y datos
    if (this.dom.hangmanOriginLabel) {
      this.dom.hangmanOriginLabel.textContent = `${proverb.ethnicGroup} • ${proverb.category}`;
    }
    if (this.dom.hangmanCategoryBadge) {
      this.dom.hangmanCategoryBadge.textContent = `🌿 ${proverb.category}`;
    }
    if (this.dom.hangmanProverbNum) {
      this.dom.hangmanProverbNum.textContent = `#${this.currentProverbIndex + 1}/${proverbsData.length}`;
    }
    if (this.dom.hangmanStarsCount) {
      this.dom.hangmanStarsCount.textContent = profileManager.profile.stars;
    }

    // Resetear visualización de pista cultural
    if (this.dom.hangmanHintTextBox) this.dom.hangmanHintTextBox.style.display = 'none';
    if (this.dom.btnHangmanHint) {
      this.dom.btnHangmanHint.disabled = false;
      this.dom.btnHangmanHint.classList.remove('used');
      const hintLabel = this.dom.btnHangmanHint.querySelector('.dock-btn-label');
      if (hintLabel) hintLabel.textContent = 'Pista (1)';
    }

    this.renderHangmanLivesAndTotem();
    this.renderHangmanBoard();
    this.renderHangmanKeyboard();
  }

  renderHangmanLivesAndTotem() {
    const lives = this.hangmanEngine.lives;
    const maxLives = this.hangmanEngine.maxLives;
    const mistakes = this.hangmanEngine.mistakes;

    // Vidas (corazones)
    if (this.dom.hangmanLivesIcons) {
      this.dom.hangmanLivesIcons.innerHTML = '';
      for (let i = 0; i < maxLives; i++) {
        const heart = document.createElement('span');
        heart.className = `hangman-life-icon ${i < lives ? 'active' : 'lost'}`;
        heart.textContent = i < lives ? '❤️' : '🖤';
        this.dom.hangmanLivesIcons.appendChild(heart);
      }
    }

    // Tótem SVG: mostrar partes del tótem según número de fallos
    for (let step = 1; step <= 6; step++) {
      const part = document.getElementById(`totem-part-${step}`);
      if (part) {
        if (step <= mistakes) {
          part.classList.add('visible');
        } else {
          part.classList.remove('visible');
        }
      }
    }
  }

  renderHangmanBoard() {
    if (!this.dom.hangmanPhraseGrid || !this.hangmanEngine.currentProverb) return;
    const proverb = this.hangmanEngine.currentProverb;
    const words = proverb.phrase.split(' ');

    this.dom.hangmanPhraseGrid.innerHTML = '';

    words.forEach((word) => {
      const wordWrap = document.createElement('div');
      wordWrap.className = 'hangman-word-wrap';

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const normalized = this.hangmanEngine.normalizeChar(char);

        if (this.hangmanEngine.isLetter(char)) {
          const isGuessed = this.hangmanEngine.guessedLetters.has(normalized);
          const isRevealed = isGuessed || this.hangmanEngine.revealedLetters.has(normalized);

          const slot = document.createElement('div');
          slot.className = `hangman-letter-slot ${isRevealed ? 'revealed' : ''}`;
          slot.textContent = isRevealed ? char.toUpperCase() : '';
          wordWrap.appendChild(slot);
        } else {
          // Signo de puntuación
          const punct = document.createElement('div');
          punct.className = 'hangman-punct-slot';
          punct.textContent = char;
          wordWrap.appendChild(punct);
        }
      }

      this.dom.hangmanPhraseGrid.appendChild(wordWrap);
    });
  }

  renderHangmanKeyboard() {
    if (!this.dom.hangmanKeyboardWrap) return;
    const keyboardRows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    this.dom.hangmanKeyboardWrap.innerHTML = '';

    keyboardRows.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'hangman-kb-row';

      row.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'hangman-kb-key';
        btn.textContent = letter;
        btn.dataset.letter = letter;

        const isGuessed = this.hangmanEngine.guessedLetters.has(letter);
        if (isGuessed) {
          btn.disabled = true;
          const isHit = this.hangmanEngine.targetLetters.has(letter);
          btn.classList.add(isHit ? 'correct' : 'wrong');
        }

        btn.addEventListener('click', () => {
          this.handleHangmanLetter(letter);
        });

        rowDiv.appendChild(btn);
      });

      this.dom.hangmanKeyboardWrap.appendChild(rowDiv);
    });
  }

  handleHangmanLetter(letter) {
    if (this.hangmanEngine.isGameOver) return;

    const res = this.hangmanEngine.guessLetter(letter);
    if (res.alreadyGuessed) return;

    if (res.isHit) {
      sound.playMatch();
    } else {
      sound.playWrong();
      const svg = document.getElementById('hangman-totem-svg');
      if (svg) {
        svg.classList.remove('shake-anim');
        void svg.offsetWidth;
        svg.classList.add('shake-anim');
      }
    }

    this.renderHangmanLivesAndTotem();
    this.renderHangmanBoard();
    this.renderHangmanKeyboard();

    if (res.isWon) {
      sound.playVictory();
      const proverb = this.hangmanEngine.currentProverb;
      profileManager.recordProverbWon(proverb.id, 3);
      if (this.dom.hangmanStarsCount) {
        this.dom.hangmanStarsCount.textContent = profileManager.profile.stars;
      }
      setTimeout(() => {
        this.showHangmanResultModal(true);
      }, 500);
    } else if (res.isLost) {
      sound.playWrong();
      setTimeout(() => {
        this.showHangmanResultModal(false);
      }, 500);
    }
  }

  useHangmanHint() {
    if (this.hangmanEngine.isGameOver) return;

    if (this.hangmanEngine.hasUsedHint()) {
      sound.playWrong();
      alert('Solo se permite 1 pista cultural por cada proverbio.');
      return;
    }

    const hint = this.hangmanEngine.useHint();
    if (hint) {
      sound.playSparkle();
      if (this.dom.hangmanHintTextBox) {
        this.dom.hangmanHintTextBox.style.display = 'block';
        if (this.dom.hangmanHintMessage) {
          this.dom.hangmanHintMessage.textContent = hint;
        }
      }
      if (this.dom.btnHangmanHint) {
        this.dom.btnHangmanHint.disabled = true;
        this.dom.btnHangmanHint.classList.add('used');
        const hintLabel = this.dom.btnHangmanHint.querySelector('.dock-btn-label');
        if (hintLabel) hintLabel.textContent = 'Pista Usada';
      }
    }
  }

  showHangmanResultModal(isWon) {
    const proverb = this.hangmanEngine.currentProverb;
    if (!proverb || !this.dom.modalHangmanResult) return;

    if (this.dom.hmResBadge) {
      this.dom.hmResBadge.textContent = isWon ? '✨ SABIDURÍA REVELADA' : '⏳ FIN DE VIDAS';
      this.dom.hmResBadge.className = `modal-badge-cultural ${isWon ? 'badge-won' : 'badge-lost'}`;
    }
    if (this.dom.hmResIcon) {
      this.dom.hmResIcon.textContent = isWon ? '🏆' : '🪘';
    }
    if (this.dom.hmResTitle) {
      this.dom.hmResTitle.textContent = isWon ? '¡Proverbio Descubierto!' : 'El Proverbio Revelado';
    }
    if (this.dom.hmResPhrase) {
      this.dom.hmResPhrase.textContent = `«${proverb.phrase}»`;
    }
    if (this.dom.hmResNative) {
      this.dom.hmResNative.textContent = proverb.native ? `«${proverb.native}»` : '';
    }
    if (this.dom.hmResCulture) {
      this.dom.hmResCulture.textContent = `📜 ${proverb.ethnicGroup} • ${proverb.category}`;
    }
    if (this.dom.hmResMeaning) {
      this.dom.hmResMeaning.textContent = proverb.meaning;
    }
    if (this.dom.hmResStars) {
      this.dom.hmResStars.textContent = isWon ? '+3 ⭐' : '0 ⭐';
    }

    this.dom.modalHangmanResult.style.display = 'flex';
    this.dom.modalHangmanResult.classList.add('active');
  }

  closeHangmanModal() {
    if (this.dom.modalHangmanResult) {
      this.dom.modalHangmanResult.style.display = 'none';
      this.dom.modalHangmanResult.classList.remove('active');
    }
  }

  nextHangmanProverb() {
    this.currentProverbIndex = (this.currentProverbIndex + 1) % proverbsData.length;
    this.startHangmanProverb(this.currentProverbIndex);
  }

  renderHomeScreen() {
    const prof = profileManager.profile;
    this.setAvatarElement(this.dom.homeAvatar, prof.avatar);
    this.dom.homeUsername.textContent = prof.name;
    this.dom.homeStarsCount.textContent = prof.stars;

    // Nivel sugerido (siguiente o actual)
    const nextLvl = this.allLevels[this.currentLevelIndex] || this.allLevels[0];
    this.dom.homeCurrentCategory.textContent = `${nextLvl.categoryIcon} ${nextLvl.categoryName}`;
    this.dom.homeCurrentLevelTitle.textContent = nextLvl.title;
    this.dom.homeCurrentClue.textContent = nextLvl.clue;

    // Curiosidades aleatorias
    const trivias = [
      "El Pico Basilé es la cumbre más alta de Guinea Ecuatorial con 3.011 metros.",
      "El Pepesup se elabora tradicionalmente con pescado fresco de las costas de Río Muni y Bioko.",
      "La Ceiba es el árbol nacional sagrado presente en el escudo de Guinea Ecuatorial.",
      "El Mvet es un instrumento de cuerda sagrado que acompaña los relatos épicos Fang.",
      "Ureka, al sur de Bioko, es uno de los lugares más lluviosos del planeta y refugio de tortugas marinas."
    ];
    this.dom.dailyTriviaText.innerHTML = `<strong>¿Sabías qué?</strong> ${trivias[Math.floor(Math.random() * trivias.length)]}`;

    // Renderizar categorías
    this.dom.homeCategoriesList.innerHTML = '';
    this.categories.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'category-home-card';
      const completedInCat = prof.categoryProgress[cat.id] || 0;
      const totalInCat = cat.levels.length;
      const pct = Math.min(Math.round((completedInCat / totalInCat) * 100), 100);

      card.innerHTML = `
        <span class="cat-card-icon">${cat.icon}</span>
        <span class="cat-card-name">${cat.name}</span>
        <span class="cat-card-levels">${completedInCat}/${totalInCat} completados</span>
        <div class="cat-card-bar">
          <div class="cat-card-bar-fill" style="width: ${pct}%"></div>
        </div>
      `;

      card.addEventListener('click', () => {
        // Buscar el primer nivel no completado de esta categoría
        const firstUncompleted = this.allLevels.findIndex(l => l.categoryId === cat.id && !prof.completedLevels.includes(l.id));
        const chosenIdx = firstUncompleted >= 0 ? firstUncompleted : this.allLevels.findIndex(l => l.categoryId === cat.id);
        this.currentLevelIndex = chosenIdx >= 0 ? chosenIdx : 0;
        this.switchScreen('game');
        this.loadLevel(this.currentLevelIndex);
      });

      this.dom.homeCategoriesList.appendChild(card);
    });
  }

  /* ================= PANTALLA DE PERFIL ================= */

  renderProfileScreen() {
    const prof = profileManager.profile;
    this.setAvatarElement(this.dom.profileAvatarDisplay, prof.avatar);
    this.dom.inputProfileName.value = prof.name;
    const website = (this.sponsorshipConfig && this.sponsorshipConfig.website) || "https://www.aegle.gq/";
    if (prof.title && prof.title.includes('AEGLE')) {
      this.dom.profileTitleDisplay.innerHTML = prof.title.replace(/\bAEGLE\b/g, `<a href="${website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">AEGLE</a>`);
    } else {
      this.dom.profileTitleDisplay.textContent = prof.title;
    }

    // Ciudad del Jugador (Autocomplete / Libre)
    if (this.dom.inputProfileCity) {
      this.dom.inputProfileCity.value = prof.city || 'Malabo';
    }

    // KPIs
    this.dom.kpiLevels.textContent = prof.levelsCompleted;
    this.dom.kpiWords.textContent = prof.wordsFound;
    this.dom.kpiStars.textContent = prof.stars;
    if (this.dom.kpiSpeed) {
      this.dom.kpiSpeed.textContent = prof.fastestLevelTime ? `${prof.fastestLevelTime}s` : '--';
    }
    this.dom.kpiStreak.textContent = prof.streakDays;

    // Barras de progreso cultural
    this.dom.cultureProgressBars.innerHTML = '';
    this.categories.forEach(cat => {
      const completed = prof.categoryProgress[cat.id] || 0;
      const total = cat.levels.length;
      const pct = Math.min(Math.round((completed / total) * 100), 100);

      const item = document.createElement('div');
      item.className = 'culture-progress-item';
      item.innerHTML = `
        <div class="culture-item-header">
          <span>${cat.icon} ${cat.name}</span>
          <span>${completed}/${total} (${pct}%)</span>
        </div>
        <div class="culture-bar-track">
          <div class="culture-bar-fill" style="width: ${pct}%"></div>
        </div>
      `;
      this.dom.cultureProgressBars.appendChild(item);
    });

    // Insignias y Logros
    this.dom.profileAchievementsList.innerHTML = '';
    prof.achievements.forEach(ach => {
      const achCard = document.createElement('div');
      achCard.className = `achievement-card ${ach.unlocked ? 'unlocked' : ''}`;
      const titleHtml = ach.title.replace(/\bAEGLE\b/g, `<a href="${website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">AEGLE</a>`);
      const descHtml = ach.desc
        .replace(/Academia Ecuatoguineana de la Lengua Española/g, `<a href="${website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">Academia Ecuatoguineana de la Lengua Española</a>`)
        .replace(/\bAEGLE\b/g, `<a href="${website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">AEGLE</a>`);

      achCard.innerHTML = `
        <span class="ach-icon">${ach.icon}</span>
        <div class="ach-info">
          <span class="ach-title">${titleHtml} ${ach.unlocked ? '✨' : '🔒'}</span>
          <span class="ach-desc">${descHtml}</span>
        </div>
      `;
      this.dom.profileAchievementsList.appendChild(achCard);
    });
  }

  /* ================= MOTOR DE JUEGO (GAMEPLAY) ================= */

  loadLevel(index) {
    if (index < 0 || index >= this.allLevels.length) index = 0;
    this.currentLevelIndex = index;
    this.currentLevel = this.allLevels[index];

    this.selectedTiles = [];
    this.isDragging = false;
    this.isAnimating = false;
    this.clearSvgLine();

    this.dom.levelBadge.textContent = `Nivel ${index + 1}/${this.allLevels.length}`;
    this.dom.categoryTag.textContent = `${this.currentLevel.categoryIcon} ${this.currentLevel.categoryName}`;
    this.dom.clueText.textContent = this.currentLevel.clue;
    this.dom.currentWordText.textContent = 'DESLIZA';
    this.dom.wordBubble.classList.remove('active', 'shake');

    this.targetWords = this.currentLevel.words.map(w => ({
      word: w.word.toUpperCase().replace(/[^A-ZÑ]/g, ''),
      original: w.word,
      clue: w.clue,
      found: false
    }));

    this.renderTargetsBar();

    const cols = this.currentLevel.gridSize?.cols || 4;
    const rows = this.currentLevel.gridSize?.rows || 5;
    this.cols = cols;
    this.rows = rows;

    const boardData = GridEngine.generateBoard(this.currentLevel.words, cols, rows);
    this.grid = boardData.grid;
    this.rows = boardData.rows;
    this.cols = boardData.cols;

    this.hintsUsedThisLevel = 0;
    this.updateHintButtonState();

    this.renderGrid();
    this.startTimer();
  }

  updateHintButtonState() {
    if (!this.dom.btnHint) return;
    const label = this.dom.btnHint.querySelector('.dock-btn-label');
    if (this.hintsUsedThisLevel >= 1) {
      this.dom.btnHint.classList.add('disabled');
      this.dom.btnHint.title = 'Solo se permite 1 pista por nivel (usada)';
      if (label) label.textContent = 'Pista (0)';
    } else {
      this.dom.btnHint.classList.remove('disabled');
      this.dom.btnHint.title = '1 pista disponible para este nivel';
      if (label) label.textContent = 'Pista (1)';
    }
  }

  renderTargetsBar() {
    this.dom.targetsBar.innerHTML = '';
    this.targetWords.forEach(tw => {
      const pill = document.createElement('div');
      pill.className = `target-pill ${tw.found ? 'found' : ''}`;
      pill.id = `target-${tw.word}`;
      pill.textContent = tw.original;
      this.dom.targetsBar.appendChild(pill);
    });
  }

  renderGrid() {
    this.dom.gridContainer.innerHTML = '';
    this.dom.gridContainer.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
    this.dom.gridContainer.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.grid[r][c];
        if (tile) {
          const el = document.createElement('div');
          el.className = 'tile-cell';
          el.id = tile.id;
          el.dataset.tileId = tile.id;
          el.dataset.row = r;
          el.dataset.col = c;
          el.dataset.letter = tile.letter;

          const letterSpan = document.createElement('span');
          letterSpan.className = 'tile-letter';
          letterSpan.textContent = tile.letter;
          el.appendChild(letterSpan);

          this.dom.gridContainer.appendChild(el);
        } else {
          const empty = document.createElement('div');
          empty.className = 'tile-cell-empty';
          this.dom.gridContainer.appendChild(empty);
        }
      }
    }
  }

  /* Gestor de Arrastre Táctil (Touch & Drag) */

  onPointerDown(e) {
    if (this.currentScreen !== 'game' || this.isAnimating) return;
    const tileEl = e.target.closest('.tile-cell');
    if (!tileEl) return;

    this.isDragging = true;
    this.selectedTiles = [];
    this.clearTileStyles();
    this.addTileToSelection(tileEl);
  }

  onPointerMove(e) {
    if (!this.isDragging || this.isAnimating) return;

    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element) return;

    const tileEl = element.closest('.tile-cell');
    if (!tileEl) return;

    const tileId = tileEl.dataset.tileId;
    const lastTile = this.selectedTiles[this.selectedTiles.length - 1];

    if (!lastTile) {
      this.addTileToSelection(tileEl);
      return;
    }

    const existingIndex = this.selectedTiles.findIndex(t => t.id === tileId);

    if (existingIndex >= 0) {
      if (existingIndex === this.selectedTiles.length - 2) {
        this.removeLastTileFromSelection();
      }
      return;
    }

    const r = parseInt(tileEl.dataset.row, 10);
    const c = parseInt(tileEl.dataset.col, 10);

    const isAdjacent = Math.abs(r - lastTile.row) <= 1 &&
                       Math.abs(c - lastTile.col) <= 1 &&
                       !(r === lastTile.row && c === lastTile.col);

    if (isAdjacent) {
      this.addTileToSelection(tileEl);
    }
  }

  onPointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.selectedTiles.length === 0) return;

    const formedWord = this.selectedTiles.map(t => t.letter).join('');
    this.evaluateWord(formedWord);
  }

  addTileToSelection(tileEl) {
    const tileObj = {
      id: tileEl.dataset.tileId,
      row: parseInt(tileEl.dataset.row, 10),
      col: parseInt(tileEl.dataset.col, 10),
      letter: tileEl.dataset.letter,
      el: tileEl
    };

    this.selectedTiles.push(tileObj);
    tileEl.classList.add('selected');
    tileEl.classList.remove('hinted');

    sound.playTileConnect(this.selectedTiles.length);
    this.updateWordPreview();
    this.updateSvgLine();
  }

  removeLastTileFromSelection() {
    const removed = this.selectedTiles.pop();
    if (removed && removed.el) {
      removed.el.classList.remove('selected');
    }
    sound.playTileConnect(this.selectedTiles.length);
    this.updateWordPreview();
    this.updateSvgLine();
  }

  updateWordPreview() {
    if (this.selectedTiles.length === 0) {
      this.dom.currentWordText.textContent = 'DESLIZA';
      this.dom.wordBubble.classList.remove('active');
    } else {
      const word = this.selectedTiles.map(t => t.letter).join('');
      this.dom.currentWordText.textContent = word;
      this.dom.wordBubble.classList.add('active');
    }
  }

  clearTileStyles() {
    document.querySelectorAll('.tile-cell.selected').forEach(el => el.classList.remove('selected'));
  }

  updateSvgLine() {
    if (this.selectedTiles.length < 2) {
      this.clearSvgLine();
      return;
    }

    const frameRect = this.dom.boardFrame.getBoundingClientRect();
    const points = this.selectedTiles.map(tile => {
      const rect = tile.el.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) - frameRect.left;
      const y = (rect.top + rect.height / 2) - frameRect.top;
      return `${x},${y}`;
    }).join(' ');

    this.dom.dragPolyline.setAttribute('points', points);
  }

  clearSvgLine() {
    this.dom.dragPolyline.setAttribute('points', '');
  }

  /* Validación de Palabra y Efecto de Gravedad */

  evaluateWord(formedWord) {
    const matched = this.targetWords.find(tw => !tw.found && tw.word === formedWord);

    if (matched) {
      matched.found = true;
      sound.playWordMatch();

      // Guardar en estadísticas de perfil
      profileManager.recordWordFound(matched.word, this.currentLevel.categoryId);

      // En Modo Contrarreloj: bonificación de +10s por palabra encontrada
      if (this.gameMode === 'timeattack') {
        this.addTimeAttackBonus(10);
      }

      const pill = document.getElementById(`target-${matched.word}`);
      if (pill) pill.classList.add('found');

      this.dom.wordBubble.classList.remove('active');
      this.dom.currentWordText.textContent = `¡${matched.original}!`;

      this.isAnimating = true;
      this.clearSvgLine();

      this.selectedTiles.forEach(t => {
        if (t.el) t.el.classList.add('vanish');
      });

      setTimeout(() => {
        this.applyGravity(this.selectedTiles);
      }, 320);

    } else {
      sound.playInvalid();
      this.dom.wordBubble.classList.add('shake');
      setTimeout(() => {
        this.dom.wordBubble.classList.remove('shake', 'active');
        this.dom.currentWordText.textContent = 'DESLIZA';
      }, 400);

      this.clearTileStyles();
      this.clearSvgLine();
      this.selectedTiles = [];
    }
  }

  applyGravity(removedTiles) {
    const { newGrid, drops } = GridEngine.dropTiles(this.grid, removedTiles);
    this.grid = newGrid;

    if (drops.length > 0) {
      sound.playTileDrop();
    }

    this.renderGrid();
    this.selectedTiles = [];
    this.clearSvgLine();
    this.isAnimating = false;

    this.checkWinCondition();

    // Detección proactiva de bloqueo: si aún quedan palabras pero ninguna tiene ruta contigua válida
    const unfoundWords = this.targetWords.filter(tw => !tw.found).map(tw => tw.word);
    if (unfoundWords.length > 0 && !this.targetWords.every(tw => tw.found)) {
      const available = GridEngine.findAvailableWord(this.grid, unfoundWords);
      if (!available) {
        setTimeout(() => {
          this.shakeBoard(true);
        }, 500);
      }
    }
  }

  checkWinCondition() {
    const allFound = this.targetWords.every(tw => tw.found);
    if (allFound) {
      this.stopTimer();

      let isNewRecord = false;
      let finalTimeText = '';
      let timeAttackScore = 0;

      if (this.gameMode === 'classic') {
        isNewRecord = profileManager.recordLevelTime(this.currentLevel.id, this.elapsedSeconds);
        finalTimeText = this._formatTime(this.elapsedSeconds);
      } else if (this.gameMode === 'timeattack') {
        timeAttackScore = this.timeAttackRemainingSeconds * 10;
        profileManager.recordTimeAttackScore(timeAttackScore, 1);
        finalTimeText = `${this.timeAttackRemainingSeconds}s restantes (+${timeAttackScore} pts)`;
        isNewRecord = true;
      }

      // Registrar nivel completado en el perfil
      profileManager.recordLevelCompleted(this.currentLevel.id, this.currentLevel.categoryId, 3);

      setTimeout(() => {
        sound.playVictory();
        this.showVictoryModal(finalTimeText, isNewRecord);
      }, 400);
    }
  }

  /* Modales y Potenciadores */

  useHint() {
    if (this.isAnimating) return;

    // Regla: El jugador solo puede usar una pista por cada nivel
    if (this.hintsUsedThisLevel >= 1) {
      sound.playInvalid();
      if (this.dom.btnHint) {
        this.dom.btnHint.classList.add('shake');
        setTimeout(() => this.dom.btnHint.classList.remove('shake'), 400);
      }
      if (this.dom.wordBubble && this.dom.currentWordText) {
        this.dom.currentWordText.textContent = '¡1 PISTA POR NIVEL!';
        this.dom.wordBubble.classList.add('active', 'shake');
        setTimeout(() => {
          this.dom.wordBubble.classList.remove('shake');
          if (!this.isDragging) {
            this.dom.currentWordText.textContent = 'DESLIZA';
            this.dom.wordBubble.classList.remove('active');
          }
        }, 1600);
      }
      return;
    }

    const unfoundWords = this.targetWords.filter(tw => !tw.found).map(tw => tw.word);
    if (unfoundWords.length === 0) return;

    this.hintsUsedThisLevel++;
    this.updateHintButtonState();

    sound.playSparkle();

    // 1. Buscar si hay una palabra contigua inmediatamente conectable
    let available = GridEngine.findAvailableWord(this.grid, unfoundWords);

    // 2. Si las fichas actuales no forman contiguidad, reorganizar automáticamente para garantizar una solución inmediata
    if (!available || !available.path || available.path.length === 0) {
      this.grid = GridEngine.reshuffleBoard(this.grid, unfoundWords);
      this.renderGrid();
      available = GridEngine.findAvailableWord(this.grid, unfoundWords);
    }

    if (available && available.path && available.path.length > 0) {
      // 3. Iluminar todas las fichas de la palabra encontrada con animación secuencial dorada
      available.path.forEach((tile, idx) => {
        const el = document.getElementById(tile.id);
        if (el) {
          setTimeout(() => {
            el.classList.add('hinted');
            setTimeout(() => el.classList.remove('hinted'), 3200);
          }, idx * 90);
        }
      });

      // 4. Mostrar el término en la burbuja central de pista
      if (this.dom.wordBubble && this.dom.currentWordText) {
        const originalTarget = this.targetWords.find(tw => tw.word === available.word);
        const displayWord = originalTarget ? originalTarget.original : available.word;
        this.dom.currentWordText.textContent = `💡 ${displayWord}`;
        this.dom.wordBubble.classList.add('active');
        setTimeout(() => {
          if (!this.isDragging) {
            this.dom.currentWordText.textContent = 'DESLIZA';
            this.dom.wordBubble.classList.remove('active');
          }
        }, 2800);
      }

      // 5. Destacar la palabra en la barra superior de objetivos
      const targetPills = document.querySelectorAll('.target-pill');
      targetPills.forEach(pill => {
        if (pill.dataset.word === available.word) {
          pill.style.animation = 'pulseScale 0.8s 3';
          pill.style.borderColor = '#fbbf24';
          setTimeout(() => {
            pill.style.animation = '';
            pill.style.borderColor = '';
          }, 2400);
        }
      });
    } else {
      this.shakeBoard(true);
    }
  }

  shakeBoard(auto = false) {
    sound.playSparkle();
    this.dom.boardFrame.classList.add('shake');

    const unfoundWords = this.targetWords.filter(tw => !tw.found).map(tw => tw.word);
    if (unfoundWords.length > 0) {
      this.grid = GridEngine.reshuffleBoard(this.grid, unfoundWords);
      setTimeout(() => {
        this.renderGrid();
        this.dom.boardFrame.classList.remove('shake');
        if (auto) {
          this.dom.wordBubble.textContent = '¡Fichas reorganizadas!';
          this.dom.wordBubble.classList.add('active');
          setTimeout(() => this.dom.wordBubble.classList.remove('active'), 1800);
        }
      }, 350);
    } else {
      setTimeout(() => this.dom.boardFrame.classList.remove('shake'), 500);
    }
  }

  showVictoryModal(timeText = '', isRecord = false) {
    this.dom.victorySummary.innerHTML = '';

    if (this.dom.victoryTimeText) {
      this.dom.victoryTimeText.textContent = timeText || this._formatTime(this.elapsedSeconds);
    }
    if (this.dom.victoryRecordBadge) {
      if (this.gameMode === 'timeattack') {
        this.dom.victoryRecordBadge.style.display = 'inline-block';
        this.dom.victoryRecordBadge.textContent = '⚡ ¡RETO CONTRARRELOJ!';
      } else {
        this.dom.victoryRecordBadge.style.display = isRecord ? 'inline-block' : 'none';
        this.dom.victoryRecordBadge.textContent = '⚡ ¡NUEVO RÉCORD!';
      }
    }

    this.currentLevel.words.forEach(w => {
      const item = document.createElement('div');
      item.innerHTML = `
        <div class="cultural-item-word">🇬🇶 ${w.word}</div>
        <div class="cultural-item-desc">${w.clue}</div>
      `;
      this.dom.victorySummary.appendChild(item);
    });

    this.dom.victoryModal.classList.add('active');
  }

  showGlossaryModal() {
    this.dom.glossaryContent.innerHTML = '';
    this.currentLevel.words.forEach(w => {
      const item = document.createElement('div');
      item.style.marginBottom = '10px';
      item.innerHTML = `
        <div class="cultural-item-word">🇬🇶 ${w.word}</div>
        <div class="cultural-item-desc">${w.clue}</div>
      `;
      this.dom.glossaryContent.appendChild(item);
    });

    this.dom.glossaryModal.classList.add('active');
  }

  showLevelsModal() {
    this.dom.categoriesContainer.innerHTML = '';

    this.categories.forEach(cat => {
      const catTitle = document.createElement('h3');
      catTitle.style.fontSize = '0.92rem';
      catTitle.style.color = '#f59e0b';
      catTitle.style.marginTop = '12px';
      catTitle.style.marginBottom = '6px';
      catTitle.style.textAlign = 'left';
      catTitle.textContent = `${cat.icon} ${cat.name}`;
      this.dom.categoriesContainer.appendChild(catTitle);

      const grid = document.createElement('div');
      grid.className = 'level-list-grid';

      cat.levels.forEach(lvl => {
        const lvlIdx = this.allLevels.findIndex(l => l.id === lvl.id);
        const card = document.createElement('div');
        card.className = `level-select-card ${lvlIdx === this.currentLevelIndex ? 'active' : ''}`;
        card.innerHTML = `
          <div style="font-weight: 700; font-size: 0.8rem; color: #6ee7b7;">${lvl.title}</div>
          <div style="font-size: 0.7rem; color: #94a3b8;">${lvl.words.length} palabras</div>
        `;
        card.addEventListener('click', () => {
          this.loadLevel(lvlIdx);
          this.dom.levelsModal.classList.remove('active');
        });
        grid.appendChild(card);
      });

      this.dom.categoriesContainer.appendChild(grid);
    });

    this.dom.levelsModal.classList.add('active');
  }

  /* ================= CONTROLADOR DE TIEMPO Y CONTRARRELOJ ================= */

  startTimer() {
    this.stopTimer();

    if (this.gameMode === 'classic') {
      this.elapsedSeconds = 0;
      if (this.dom.gameTimerBadge) {
        this.dom.gameTimerBadge.classList.remove('urgency');
        this.dom.gameTimerIcon.textContent = '⏱️';
      }
      if (this.dom.timeattackBarWrap) {
        this.dom.timeattackBarWrap.style.display = 'none';
      }
      this.updateTimerDisplay();
      this.timerInterval = setInterval(() => {
        this.elapsedSeconds++;
        this.updateTimerDisplay();
      }, 1000);

    } else if (this.gameMode === 'timeattack') {
      // Base: 20s por palabra (mínimo 60s, máximo 120s)
      const wordsCount = this.currentLevel?.words?.length || 4;
      this.timeAttackTotalSeconds = Math.max(60, Math.min(120, wordsCount * 22));
      this.timeAttackRemainingSeconds = this.timeAttackTotalSeconds;

      if (this.dom.gameTimerBadge) {
        this.dom.gameTimerBadge.classList.remove('urgency');
        this.dom.gameTimerIcon.textContent = '⚡';
      }
      if (this.dom.timeattackBarWrap) {
        this.dom.timeattackBarWrap.style.display = 'block';
      }
      this.updateTimeAttackDisplay();

      this.timerInterval = setInterval(() => {
        this.timeAttackRemainingSeconds--;
        this.updateTimeAttackDisplay();

        if (this.timeAttackRemainingSeconds <= 0) {
          this.handleTimeOut();
        }
      }, 1000);
    }
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  _formatTime(totalSec) {
    const mins = Math.floor(Math.max(0, totalSec) / 60);
    const secs = Math.max(0, totalSec) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  updateTimerDisplay() {
    if (this.dom.gameTimerText) {
      this.dom.gameTimerText.textContent = this._formatTime(this.elapsedSeconds);
    }
  }

  updateTimeAttackDisplay() {
    if (!this.dom.gameTimerText) return;
    this.dom.gameTimerText.textContent = this._formatTime(this.timeAttackRemainingSeconds);

    const pct = Math.max(0, Math.min(100, (this.timeAttackRemainingSeconds / this.timeAttackTotalSeconds) * 100));
    if (this.dom.timeattackBarFill) {
      this.dom.timeattackBarFill.style.width = `${pct}%`;
    }

    if (this.timeAttackRemainingSeconds <= 15) {
      this.dom.gameTimerBadge.classList.add('urgency');
    } else {
      this.dom.gameTimerBadge.classList.remove('urgency');
    }
  }

  addTimeAttackBonus(seconds = 10) {
    if (this.gameMode !== 'timeattack') return;
    this.timeAttackRemainingSeconds += seconds;
    this.updateTimeAttackDisplay();

    if (this.dom.timerBonusPill) {
      this.dom.timerBonusPill.textContent = `+${seconds}s`;
      this.dom.timerBonusPill.classList.add('show');
      setTimeout(() => {
        if (this.dom.timerBonusPill) this.dom.timerBonusPill.classList.remove('show');
      }, 800);
    }
  }

  handleTimeOut() {
    this.stopTimer();
    sound.playInvalid();
    const foundCount = this.targetWords.filter(tw => tw.found).length;
    if (this.dom.timeoutWordsCount) {
      this.dom.timeoutWordsCount.textContent = `${foundCount}/${this.targetWords.length}`;
    }
    if (this.dom.timeoutModal) {
      this.dom.timeoutModal.classList.add('active');
    }
  }

  /* ================= SALÓN DE HONOR Y RANKING GLOBAL ================= */

  switchRankingScreen(screen = 'podium') {
    this.rankingScreen = screen;
    if (this.dom.btnScreenPodium) this.dom.btnScreenPodium.classList.toggle('active', screen === 'podium');
    if (this.dom.btnScreenTable) this.dom.btnScreenTable.classList.toggle('active', screen === 'table');

    if (this.dom.rankingViewPodium) {
      this.dom.rankingViewPodium.style.display = screen === 'podium' ? 'flex' : 'none';
    }
    if (this.dom.rankingViewTable) {
      this.dom.rankingViewTable.style.display = screen === 'table' ? 'flex' : 'none';
    }

    if (this.dom.rankingModalTitle) {
      const isEnabled = this.sponsorshipConfig && this.sponsorshipConfig.enabled;
      const short = (this.sponsorshipConfig && this.sponsorshipConfig.sponsorShort) || 'AEGLE';
      const website = (this.sponsorshipConfig && this.sponsorshipConfig.website) || "https://www.aegle.gq/";
      if (isEnabled) {
        this.dom.rankingModalTitle.innerHTML = screen === 'podium' 
          ? `🏆 Salón de Honor de la <a href="${website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">${short}</a>` 
          : `📊 Tabla Top 50 <a href="${website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">${short}</a>`;
      } else {
        this.dom.rankingModalTitle.textContent = screen === 'podium' ? '🏆 Salón de Honor GE' : '📊 Tabla Top 50 Global';
      }
    }
  }

  async openRankingModal() {
    this.rankingFilter = 'stars';
    if (this.dom.rankingModal) {
      this.dom.rankingModal.classList.add('active');
    }

    this.switchRankingScreen(this.rankingScreen || 'podium');

    // Mostrar loader temporal en la tabla
    if (this.dom.rankingPlayersList) {
      this.dom.rankingPlayersList.innerHTML = `
        <div style="text-align: center; padding: 24px; color: #94a3b8;">
          <div style="font-size: 1.6rem; animation: floatEmblem 1.5s infinite;">🏆</div>
          <p style="font-size: 0.82rem; margin-top: 6px;">Cargando clasificación Top 50 de Guinea Ecuatorial...</p>
        </div>
      `;
    }

    try {
      const snap = await getDocs(collection(db, 'users'));
      let users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Integrar usuario actual
      const currUser = {
        id: profileManager.userId,
        ...profileManager.profile
      };
      const existingIdx = users.findIndex(u => u.id === currUser.id);
      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...currUser };
      } else {
        users.push(currUser);
      }

      // Asegurar que siempre hay al menos 50 clasificados en la tabla
      users = this._getEnrichedRankingUsers(users);

      this.cachedRankingUsers = users;
      this.renderRankingData();

    } catch (err) {
      console.warn('Error al cargar ranking de Firebase, usando datos locales:', err);
      const localUsers = this._getEnrichedRankingUsers([{ id: profileManager.userId, ...profileManager.profile }]);
      this.cachedRankingUsers = localUsers;
      this.renderRankingData();
    }
  }

  showPlayerProfileModal(user, rankPos = 1) {
    if (!user) return;
    this.activeProfileUser = user;
    sound.playSparkle();

    const isCurrentUser = user.id === profileManager.userId;
    const profile = isCurrentUser ? profileManager.profile : user;

    if (this.dom.ppModalTag) {
      this.dom.ppModalTag.textContent = isCurrentUser ? 'TU PERFIL DE EXPLORADOR' : 'PERFIL DE EXPLORADOR';
    }

    if (this.dom.ppAvatarDisplay) {
      const avatarHtml = (profile.avatar && (profile.avatar.startsWith('data:') || profile.avatar.startsWith('http')))
        ? `<img src="${profile.avatar}" alt="Avatar" />`
        : profile.avatar || '👤';
      this.dom.ppAvatarDisplay.innerHTML = avatarHtml;
    }

    if (this.dom.ppNameDisplay) {
      this.dom.ppNameDisplay.textContent = profile.name || 'Explorador';
    }

    if (this.dom.ppTitleDisplay) {
      const title = profile.title || (rankPos <= 3 ? '👑 Sabio Cultural de Guinea Ecuatorial' : '🌟 Explorador de las Raíces GE');
      const website = (this.sponsorshipConfig && this.sponsorshipConfig.website) || "https://www.aegle.gq/";
      if (title.includes('AEGLE')) {
        this.dom.ppTitleDisplay.innerHTML = title.replace(/\bAEGLE\b/g, `<a href="${website}" target="_blank" rel="noopener noreferrer" class="aegle-text-link">AEGLE</a>`);
      } else {
        this.dom.ppTitleDisplay.textContent = title;
      }
    }

    if (this.dom.ppCityDisplay) {
      this.dom.ppCityDisplay.textContent = `📍 ${profile.city || 'Malabo'}`;
    }

    if (this.dom.ppRankDisplay) {
      const medal = rankPos === 1 ? '🥇 #1 Puesto' : rankPos === 2 ? '🥈 #2 Puesto' : rankPos === 3 ? '🥉 #3 Puesto' : `#${rankPos} en el Top 50`;
      this.dom.ppRankDisplay.textContent = medal;
    }

    if (this.dom.ppStarsVal) {
      this.dom.ppStarsVal.textContent = profile.stars || 0;
    }

    if (this.dom.ppLevelsVal) {
      this.dom.ppLevelsVal.textContent = profile.levelsCompleted || 0;
    }

    if (this.dom.ppWordsVal) {
      this.dom.ppWordsVal.textContent = profile.wordsFound || 0;
    }

    if (this.dom.ppSpeedVal) {
      this.dom.ppSpeedVal.textContent = profile.timeAttackHighScore ? `${profile.timeAttackHighScore} pts` : '--';
    }

    if (this.dom.btnPlayerProfileAction) {
      if (isCurrentUser) {
        this.dom.btnPlayerProfileAction.textContent = '✏️ Editar Mi Perfil';
        this.dom.btnPlayerProfileAction.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
      } else {
        this.dom.btnPlayerProfileAction.textContent = 'Volver al Ranking';
        this.dom.btnPlayerProfileAction.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      }
    }

    if (this.dom.modalPlayerProfile) {
      this.dom.modalPlayerProfile.classList.add('active');
    }
  }

  _getEnrichedRankingUsers(existingUsers) {
    const guineanRoster = [
      { name: 'Leandro Mbomio', avatar: '🗿', city: 'Malabo', stars: 98, wordsFound: 85, levelsCompleted: 25, timeAttackHighScore: 1200 },
      { name: 'Martiniano Ele', avatar: '✍️', city: 'Bata', stars: 94, wordsFound: 80, levelsCompleted: 24, timeAttackHighScore: 1150 },
      { name: 'Leoncio Evita', avatar: '📖', city: 'Udubuamlange', stars: 90, wordsFound: 76, levelsCompleted: 23, timeAttackHighScore: 1100 },
      { name: 'Nchama Mangue', avatar: '👑', city: 'Malabo', stars: 58, wordsFound: 52, levelsCompleted: 18, timeAttackHighScore: 920 },
      { name: 'Mba Ondo', avatar: '🐆', city: 'Bata', stars: 54, wordsFound: 48, levelsCompleted: 16, timeAttackHighScore: 870 },
      { name: 'Mari Paz Abaha', avatar: '🌺', city: 'Ebebiyín', stars: 50, wordsFound: 45, levelsCompleted: 15, timeAttackHighScore: 810 },
      { name: 'Cándido Esono', avatar: '🛶', city: 'Luba', stars: 47, wordsFound: 41, levelsCompleted: 14, timeAttackHighScore: 760 },
      { name: 'Esperanza Bolekia', avatar: '🌋', city: 'Mongomo', stars: 44, wordsFound: 39, levelsCompleted: 13, timeAttackHighScore: 710 },
      { name: 'Juanita Mayé', avatar: '🌳', city: 'Madrid', stars: 40, wordsFound: 35, levelsCompleted: 12, timeAttackHighScore: 650 },
      { name: 'Donato Ndongo', avatar: '📚', city: 'Bata', stars: 39, wordsFound: 34, levelsCompleted: 12, timeAttackHighScore: 630 },
      { name: 'Cristina Mikue', avatar: '🌸', city: 'Barcelona', stars: 37, wordsFound: 33, levelsCompleted: 11, timeAttackHighScore: 600 },
      { name: 'Joaquín Mbomio', avatar: '🌊', city: 'Annobón', stars: 36, wordsFound: 31, levelsCompleted: 11, timeAttackHighScore: 580 },
      { name: 'Regina Nse', avatar: '🌿', city: 'Evinayong', stars: 35, wordsFound: 30, levelsCompleted: 10, timeAttackHighScore: 560 },
      { name: 'Silverio Ncogo', avatar: '🦁', city: 'Valencia', stars: 33, wordsFound: 29, levelsCompleted: 10, timeAttackHighScore: 540 },
      { name: 'Teresa Bindang', avatar: '🍲', city: 'Riaba', stars: 32, wordsFound: 28, levelsCompleted: 9, timeAttackHighScore: 520 },
      { name: 'Diosdado Mocache', avatar: '🦅', city: 'Libreville', stars: 31, wordsFound: 27, levelsCompleted: 9, timeAttackHighScore: 500 },
      { name: 'Inmaculada Obono', avatar: '💫', city: 'Malabo', stars: 30, wordsFound: 26, levelsCompleted: 9, timeAttackHighScore: 480 },
      { name: 'Anacleto Bokesa', avatar: '🎯', city: 'Bata', stars: 29, wordsFound: 25, levelsCompleted: 8, timeAttackHighScore: 460 },
      { name: 'Fátima Nzang', avatar: '✨', city: 'Zaragoza', stars: 28, wordsFound: 24, levelsCompleted: 8, timeAttackHighScore: 440 },
      { name: 'Leandro Edú', avatar: '🛡️', city: 'Añisok', stars: 27, wordsFound: 23, levelsCompleted: 8, timeAttackHighScore: 430 },
      { name: 'Rosalía Avomo', avatar: '🌟', city: 'Douala', stars: 26, wordsFound: 22, levelsCompleted: 7, timeAttackHighScore: 410 },
      { name: 'Bonifacio Obama', avatar: '🏆', city: 'Nsork', stars: 25, wordsFound: 21, levelsCompleted: 7, timeAttackHighScore: 390 },
      { name: 'Clara Mecheba', avatar: '🍃', city: 'Malabo', stars: 24, wordsFound: 20, levelsCompleted: 7, timeAttackHighScore: 380 },
      { name: 'Marcos Ela', avatar: '🔥', city: 'Bata', stars: 23, wordsFound: 19, levelsCompleted: 6, timeAttackHighScore: 360 },
      { name: 'Beatriz Mitogo', avatar: '🌺', city: 'Londres', stars: 22, wordsFound: 18, levelsCompleted: 6, timeAttackHighScore: 350 },
      { name: 'Secundino Ntutumu', avatar: '🌾', city: 'Mikomeseng', stars: 21, wordsFound: 18, levelsCompleted: 6, timeAttackHighScore: 330 },
      { name: 'Dolores Eyenga', avatar: '🌴', city: 'Sevilla', stars: 20, wordsFound: 17, levelsCompleted: 5, timeAttackHighScore: 320 },
      { name: 'Plácido Miko', avatar: '☀️', city: 'Malabo', stars: 19, wordsFound: 16, levelsCompleted: 5, timeAttackHighScore: 300 },
      { name: 'Esther Asue', avatar: '🦋', city: 'Cogo', stars: 19, wordsFound: 16, levelsCompleted: 5, timeAttackHighScore: 290 },
      { name: 'Genaro Ndong', avatar: '🏹', city: 'Bata', stars: 18, wordsFound: 15, levelsCompleted: 5, timeAttackHighScore: 280 },
      { name: 'Concepción Bilogo', avatar: '🌼', city: 'París', stars: 17, wordsFound: 14, levelsCompleted: 4, timeAttackHighScore: 270 },
      { name: 'Faustino Nguema', avatar: '🌍', city: 'Mbini', stars: 16, wordsFound: 14, levelsCompleted: 4, timeAttackHighScore: 250 },
      { name: 'Milagrosa Okomo', avatar: '💐', city: 'Malabo', stars: 16, wordsFound: 13, levelsCompleted: 4, timeAttackHighScore: 240 },
      { name: 'Eulogio Abeso', avatar: '⚓', city: 'Kogo', stars: 15, wordsFound: 13, levelsCompleted: 4, timeAttackHighScore: 230 },
      { name: 'Verónica Angue', avatar: '🌙', city: 'Bilbao', stars: 14, wordsFound: 12, levelsCompleted: 3, timeAttackHighScore: 220 },
      { name: 'Felipe Ondo', avatar: '🌲', city: 'Acurenam', stars: 14, wordsFound: 12, levelsCompleted: 3, timeAttackHighScore: 210 },
      { name: 'Gisela Mokata', avatar: '🌻', city: 'Malabo', stars: 13, wordsFound: 11, levelsCompleted: 3, timeAttackHighScore: 200 },
      { name: 'Santiago Bee', avatar: '⛵', city: 'Bata', stars: 12, wordsFound: 10, levelsCompleted: 3, timeAttackHighScore: 190 },
      { name: 'Lidia Mbasogo', avatar: '🕊️', city: 'Washington D.C.', stars: 12, wordsFound: 10, levelsCompleted: 3, timeAttackHighScore: 180 },
      { name: 'Armando Nguema', avatar: '🧭', city: 'Niefang', stars: 11, wordsFound: 9, levelsCompleted: 2, timeAttackHighScore: 170 },
      { name: 'Purificación Moto', avatar: '🌺', city: 'Malabo', stars: 10, wordsFound: 9, levelsCompleted: 2, timeAttackHighScore: 160 },
      { name: 'Lucas Obama', avatar: '⚡', city: 'Ebebiyín', stars: 10, wordsFound: 8, levelsCompleted: 2, timeAttackHighScore: 150 },
      { name: 'Sonsoles Nfumu', avatar: '🌴', city: 'Madrid', stars: 9, wordsFound: 8, levelsCompleted: 2, timeAttackHighScore: 140 },
      { name: 'Emilio Sima', avatar: '🛶', city: 'Luba', stars: 9, wordsFound: 7, levelsCompleted: 2, timeAttackHighScore: 130 },
      { name: 'Victoria Eyang', avatar: '⭐', city: 'Bata', stars: 8, wordsFound: 7, levelsCompleted: 1, timeAttackHighScore: 120 },
      { name: 'Celestino Ekua', avatar: '🛡️', city: 'Mongomo', stars: 8, wordsFound: 6, levelsCompleted: 1, timeAttackHighScore: 110 },
      { name: 'Antonia Besari', avatar: '👑', city: 'Malabo', stars: 7, wordsFound: 6, levelsCompleted: 1, timeAttackHighScore: 100 },
      { name: 'Prisciliano Ndong', avatar: '🌾', city: 'Evinayong', stars: 6, wordsFound: 5, levelsCompleted: 1, timeAttackHighScore: 90 },
      { name: 'Mercedes Nchama', avatar: '🌸', city: 'Alicante', stars: 6, wordsFound: 5, levelsCompleted: 1, timeAttackHighScore: 85 },
      { name: 'Hilario Mba', avatar: '🌳', city: 'Bata', stars: 5, wordsFound: 4, levelsCompleted: 1, timeAttackHighScore: 80 },
      { name: 'Belén Mangue', avatar: '💫', city: 'Malabo', stars: 5, wordsFound: 4, levelsCompleted: 1, timeAttackHighScore: 75 },
      { name: 'Saturnino Esono', avatar: '🐆', city: 'Añisok', stars: 4, wordsFound: 3, levelsCompleted: 1, timeAttackHighScore: 70 }
    ];

    const merged = existingUsers.map(u => {
      const rosterMatch = guineanRoster.find(r => r.name === u.name);
      if (rosterMatch) {
        return { ...u, ...rosterMatch };
      }
      return u;
    });

    guineanRoster.forEach((player, i) => {
      if (!merged.some(u => u.name === player.name)) {
        merged.push({ id: `seed-${i + 1}`, ...player });
      }
    });
    return merged;
  }

  renderRankingData() {
    let sorted = [...this.cachedRankingUsers];
    // Clasificación única unificada: ordenada por estrellas/puntos, y en caso de empate por palabras y niveles
    sorted.sort((a, b) => (b.stars || 0) - (a.stars || 0) || (b.wordsFound || 0) - (a.wordsFound || 0) || (b.levelsCompleted || 0) - (a.levelsCompleted || 0));

    // 1. Renderizar Pantalla 1: Salón de Honor (Top 3)
    if (this.dom.rankingPodium) {
      this.dom.rankingPodium.innerHTML = '';
      const top1 = sorted[0];
      const top2 = sorted[1];
      const top3 = sorted[2];

      const makePodiumStep = (user, place, cssClass, medalEmoji, crown = '') => {
        if (!user) return null;
        const scoreVal = `${user.stars || 0} ⭐`;
        const avatarHtml = (user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http')))
          ? `<img src="${user.avatar}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`
          : user.avatar || '👤';

        const stepEl = document.createElement('div');
        stepEl.className = `podium-step ${cssClass}`;
        stepEl.title = 'Toca para ver el perfil de este sabio cultural';
        stepEl.innerHTML = `
          <div class="podium-avatar-wrap">
            ${crown}
            <div class="podium-avatar">${avatarHtml}</div>
          </div>
          <div class="podium-name">${user.name || 'Explorador'}</div>
          <div class="podium-city">📍 ${user.city || 'Malabo'}</div>
          <div class="podium-score">${scoreVal}</div>
          <div class="podium-base">${medalEmoji} #${place}</div>
        `;
        stepEl.addEventListener('click', () => {
          this.showPlayerProfileModal(user, place);
        });
        return stepEl;
      };

      if (top2) {
        const step2 = makePodiumStep(top2, 2, 'silver', '🥈');
        if (step2) this.dom.rankingPodium.appendChild(step2);
      }
      if (top1) {
        const step1 = makePodiumStep(top1, 1, 'gold', '🥇', '<span class="podium-crown">👑</span>');
        if (step1) this.dom.rankingPodium.appendChild(step1);
      }
      if (top3) {
        const step3 = makePodiumStep(top3, 3, 'bronze', '🥉');
        if (step3) this.dom.rankingPodium.appendChild(step3);
      }
    }

    // 2. Renderizar Pantalla 2: Tabla Top 50 Global
    if (this.dom.rankingPlayersList) {
      this.dom.rankingPlayersList.innerHTML = '';
      const top50 = sorted.slice(0, 50);

      top50.forEach((u, idx) => {
        const pos = idx + 1;
        const isCurrentUser = u.id === profileManager.userId;
        const medalText = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`;
        const medalClass = pos <= 3 ? 'top-medal' : '';
        const scoreVal = `${u.stars || 0} ⭐`;
        const avatarHtml = (u.avatar && (u.avatar.startsWith('data:') || u.avatar.startsWith('http')))
          ? `<img src="${u.avatar}" alt="Avatar" />`
          : u.avatar || '👤';

        const row = document.createElement('div');
        row.className = `ranking-table-row ${isCurrentUser ? 'is-current-user' : ''}`;
        row.title = 'Toca para ver el perfil completo';
        row.innerHTML = `
          <div class="rank-tbl-pos ${medalClass}">${medalText}</div>
          <div class="rank-tbl-avatar">${avatarHtml}</div>
          <div class="rank-tbl-name">
            ${u.name || 'Explorador'} ${isCurrentUser ? '<span style="color:#fbbf24; font-weight:800; font-size:0.75rem;">(Tú)</span>' : ''}
          </div>
          <div class="rank-tbl-score">${scoreVal}</div>
        `;
        row.addEventListener('click', () => {
          this.showPlayerProfileModal(u, pos);
        });
        this.dom.rankingPlayersList.appendChild(row);
      });
    }

    // 3. Tarjeta Fijada de Posición del Jugador Actual
    if (this.dom.rankingCurrentUserCard) {
      const myIndex = sorted.findIndex(u => u.id === profileManager.userId);
      const myRank = myIndex >= 0 ? myIndex + 1 : sorted.length;
      const myProfile = profileManager.profile;
      const myScore = `${myProfile.stars || 0} ⭐`;
      const myAvatarHtml = (myProfile.avatar && (myProfile.avatar.startsWith('data:') || myProfile.avatar.startsWith('http')))
        ? `<img src="${myProfile.avatar}" alt="Avatar" />`
        : myProfile.avatar || '👤';

      const rankBadge = myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : `#${myRank}`;

      this.dom.rankingCurrentUserCard.innerHTML = `
        <div class="ranking-table-row is-current-user" style="margin-bottom: 0; background: rgba(245, 158, 11, 0.22); border-color: #f59e0b;" title="Toca para ver o editar tu perfil">
          <div class="rank-tbl-pos" style="color: #fbbf24; font-weight: 800;">${rankBadge}</div>
          <div class="rank-tbl-avatar" style="border-color: #f59e0b;">${myAvatarHtml}</div>
          <div class="rank-tbl-name" style="color: #fbbf24; font-weight: 800;">
            ${myProfile.name || 'Explorador'} <span style="font-size: 0.74rem; opacity: 0.9;">(Tu Posición)</span>
          </div>
          <div class="rank-tbl-score">${myScore}</div>
        </div>
      `;
      const currentUserRow = this.dom.rankingCurrentUserCard.querySelector('.ranking-table-row');
      if (currentUserRow) {
        currentUserRow.addEventListener('click', () => {
          this.showPlayerProfileModal({ id: profileManager.userId, ...myProfile }, myRank);
        });
      }
    }
  }
}

// Iniciar aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new ApalabraApp();
});
