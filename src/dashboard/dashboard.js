/**
 * ApalabraGE Dashboard - Controlador Principal de Escritorio
 * Gestión en tiempo real con Firebase Firestore de Niveles, Palabras, Categorías, Jugadores y Curiosidades.
 */

import { db } from '../firebase.js';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import defaultLevelsData from '../data/levels.json';
import bookTopicsData from '../data/bookTopics.json';

class DashboardApp {
  constructor() {
    this.state = {
      levels: [],
      categories: defaultLevelsData.categories || [],
      users: [],
      sponsorship: {
        enabled: true,
        sponsorName: "Academia Ecuatoguineana de la Lengua Española",
        sponsorShort: "AEGLE",
        website: "https://www.aegle.gq/",
        logoUrl: "/AEGLE.png"
      },
      trivias: [
        { id: 'trivia-1', text: "El Pico Basilé es la cumbre más alta de Guinea Ecuatorial con 3.011 metros.", topic: "Geografía" },
        { id: 'trivia-2', text: "El Pepesup se elabora tradicionalmente con pescado fresco de las costas de Río Muni y Bioko.", topic: "Gastronomía" },
        { id: 'trivia-3', text: "La Ceiba es el árbol nacional sagrado presente en el escudo de Guinea Ecuatorial.", topic: "Cultura" },
        { id: 'trivia-4', text: "El Mvet es un instrumento de cuerda sagrado que acompaña los relatos épicos Fang.", topic: "Tradición" },
        { id: 'trivia-5', text: "Ureka, al sur de Bioko, es uno de los lugares más lluviosos del planeta y refugio de tortugas marinas.", topic: "Biodiversidad" },
        { id: 'trivia-6', text: "El envuelto de plátano o yuca acompaña las celebraciones familiares tradicionales.", topic: "Gastronomía" },
        { id: 'trivia-7', text: "En lengua fang, el elefante se denomina 'Nzok', el gorila 'Ngo', el leopardo 'Ze' y la tortuga 'Ku'.", topic: "Fauna y Lenguas" },
        { id: 'trivia-8', text: "Martiniano Maele Nsue revolucionó la música popular guineana con himnos inolvidables como 'Andem Ela', 'Chabeli' y 'Kalara'.", topic: "Música y Arte" },
        { id: 'trivia-9', text: "El apodo del Nzalang Nacional significa 'Trueno' o 'Relámpago' en lengua fang, simbolizando la fuerza y velocidad del equipo.", topic: "Deporte Nacional" },
        { id: 'trivia-10', text: "La histórica ciudad de Santa Isabel (hoy Malabo) conserva arquitectura portuaria y una bahía volcánica única en el golfo de Guinea.", topic: "Historia" },
        { id: 'trivia-11', text: "Los nombres propios bubis tradicionales como Bisila, Boabi, Koleko, Belolo y Lobela conservan la nobleza y linajes originarios de Bioko.", topic: "Identidad y Pueblos" },
        { id: 'trivia-12', text: "El plato ndowé de palmiste se distingue por su vivo color rojizo y su exquisita preparación con pescados del litoral.", topic: "Gastronomía" },
        { id: 'trivia-13', text: "Akonangui FC, Dragón FC de Bata, Sony Ela Nguema y Atlético Semu son pilares históricos de los torneos de fútbol en Guinea Ecuatorial.", topic: "Deporte Nacional" }
      ],
      trophies: [
        { id: 'first_word', icon: '🌱', title: 'Primera Palabra', desc: 'Encontraste tu primer término en el tablero', criterion: 'first_word', target: 1 },
        { id: 'master_gastro', icon: '🍲', title: 'Cocinero de Pepesup', desc: 'Descubre los sabores tradicionales de Guinea Ecuatorial', criterion: 'category_gastro', target: 2 },
        { id: 'explorer_bioko', icon: '🗺️', title: 'Cartógrafo de Bioko', desc: 'Domina los lugares, volcanes y ciudades del país', criterion: 'category_geo', target: 2 },
        { id: 'mvet_player', icon: '🥁', title: 'Trovador del Mvet', desc: 'Conoce los símbolos ancestrales y la cultura Fang', criterion: 'category_cultura', target: 2 },
        { id: 'street_slang', icon: '💬', title: 'Palaveras de Bata', desc: 'Aprende los modismos populares y expresiones coloquiales', criterion: 'category_modismos', target: 1 },
        { id: 'academico_aegle', icon: '🎓', title: 'Académico de la AEGLE', desc: 'Máximo reconocimiento honorífico de la Academia Ecuatoguineana de la Lengua Española', criterion: 'words_count', target: 50 }
      ],
      ranks: [
        { id: 'rank-1', emblem: '🌳', title: 'Guardián de la Ceiba', requirement: 'Nivel inicial (0 - 2 niveles completados)', minLevels: 0 },
        { id: 'rank-2', emblem: '🌋', title: 'Caminante de Bioko', requirement: 'A partir de 3 niveles completados', minLevels: 3 },
        { id: 'rank-3', emblem: '🏛️', title: 'Erudito de Río Muni', requirement: 'A partir de 6 niveles completados', minLevels: 6 },
        { id: 'rank-4', emblem: '👑', title: 'Sabio de Guinea Ecuatorial', requirement: 'Completar 10 o más niveles culturales', minLevels: 10 },
        { id: 'rank-5', emblem: '🎓', title: 'Académico de la AEGLE', requirement: 'Máximo rango honorífico: 15 o más niveles dominados', minLevels: 15 }
      ],
      leaderboardMetric: 'stars',
      currentTab: 'overview',
      categoryFilter: 'all',
      searchQuery: '',
      levelSortBy: 'date',
      levelSortOrder: 'desc',
      bookTopics: bookTopicsData || [],
      importerCategoryFilter: 'all',
      importerSearchQuery: '',
      isFirestoreConnected: false,
      rankingSearchQuery: '',
      rankingMode: 'podium',
      rankingGameFilter: 'global'
    };

    this.dom = {};
  }

  async init() {
    this.cacheDOM();
    this.bindEvents();
    this.checkFirestoreConnection();
    await this.loadAllData();
  }

  cacheDOM() {
    this.dom = {
      firebaseStatusBadge: document.getElementById('firebase-status-badge'),
      firebaseProjectName: document.getElementById('firebase-project-name'),
      pageTitle: document.getElementById('page-title'),
      pageSubtitle: document.getElementById('page-subtitle'),
      navItems: document.querySelectorAll('.nav-item'),
      tabViews: document.querySelectorAll('.tab-view'),

      // Contadores en Sidebar
      navCountLevels: document.getElementById('nav-count-levels'),
      navCountCategories: document.getElementById('nav-count-categories'),
      navCountTrophies: document.getElementById('nav-count-trophies'),
      navCountTrivias: document.getElementById('nav-count-trivias'),
      navCountUsers: document.getElementById('nav-count-users'),
      navCountRanking: document.getElementById('nav-count-ranking'),
      navCountImporter: document.getElementById('nav-count-importer'),

      // KPIs Overview
      statTotalLevels: document.getElementById('stat-total-levels'),
      statTotalWords: document.getElementById('stat-total-words'),
      statTotalTrivias: document.getElementById('stat-total-trivias'),
      statTotalUsers: document.getElementById('stat-total-users'),
      statTotalTrophies: document.getElementById('stat-total-trophies'),
      tableOverviewLevels: document.getElementById('table-overview-levels').querySelector('tbody'),
      tableOverviewUsers: document.getElementById('table-overview-users').querySelector('tbody'),

      // Levels
      tableLevelsBody: document.getElementById('tbody-levels'),
      filterLevelsSearch: document.getElementById('filter-levels-search'),
      selectLevelsSort: document.getElementById('select-levels-sort'),
      thSortDate: document.getElementById('th-sort-date'),
      thSortTitle: document.getElementById('th-sort-title'),
      arrowSortDate: document.getElementById('arrow-sort-date'),
      arrowSortTitle: document.getElementById('arrow-sort-title'),
      categoryChips: document.querySelectorAll('#level-category-chips .chip'),
      btnCreateLevel: document.getElementById('btn-create-level'),
      btnAddLevelTop: document.getElementById('btn-add-level-top'),

      // Categories
      categoriesAdminList: document.getElementById('categories-admin-list'),

      // Trofeos & Récords
      trophiesAdminList: document.getElementById('trophies-admin-list'),
      ranksAdminList: document.getElementById('ranks-admin-list'),
      filterTrophiesSearch: document.getElementById('filter-trophies-search'),
      btnAddTrophy: document.getElementById('btn-add-trophy'),
      tbodyLeaderboard: document.getElementById('tbody-leaderboard'),
      leaderboardMetricChips: document.querySelectorAll('#leaderboard-metric-selector .chip'),

      // Trivias
      triviasAdminList: document.getElementById('trivias-admin-list'),
      filterTriviasSearch: document.getElementById('filter-trivias-search'),
      btnAddTrivia: document.getElementById('btn-add-trivia'),

      // Users
      tableUsersBody: document.getElementById('tbody-users'),
      filterUsersSearch: document.getElementById('filter-users-search'),
      usersCountInfo: document.getElementById('users-count-info'),

      // Importer
      importerTopicsGrid: document.getElementById('importer-topics-grid'),
      filterImporterSearch: document.getElementById('filter-importer-search'),
      importerCategoryChips: document.querySelectorAll('#importer-category-chips .chip'),
      importerCountImported: document.getElementById('importer-count-imported'),
      importerCountPending: document.getElementById('importer-count-pending'),
      btnImportAllTopics: document.getElementById('btn-import-all-topics'),

      // Backup & Sync
      btnSyncAll: document.getElementById('btn-sync-all'),
      btnExportBackup: document.getElementById('btn-export-backup'),
      btnTriggerSeed: document.getElementById('btn-trigger-seed'),
      btnQuickSeed: document.getElementById('btn-quick-seed'),

      // Sponsorship
      toggleSponsorshipActive: document.getElementById('toggle-sponsorship-active'),
      sponsorshipToggleStatusText: document.getElementById('sponsorship-toggle-status-text'),
      navSponsorshipBadge: document.getElementById('nav-sponsorship-badge'),
      formSponsorshipSettings: document.getElementById('form-sponsorship-settings'),
      inputSponsorName: document.getElementById('input-sponsor-name'),
      inputSponsorShort: document.getElementById('input-sponsor-short'),
      inputSponsorWebsite: document.getElementById('input-sponsor-website'),
      inputSponsorLogo: document.getElementById('input-sponsor-logo'),
      previewSponsorLogo: document.getElementById('preview-sponsor-logo'),
      btnSaveSponsorship: document.getElementById('btn-save-sponsorship'),

      // Modales
      modalLevel: document.getElementById('modal-level'),
      formLevel: document.getElementById('form-level'),
      btnCloseLevelModal: document.getElementById('btn-close-level-modal'),
      btnCancelLevel: document.getElementById('btn-cancel-level'),
      inputLevelId: document.getElementById('input-level-id'),
      inputLevelName: document.getElementById('input-level-name'),
      selectLevelCategory: document.getElementById('select-level-category'),
      inputLevelClue: document.getElementById('input-level-clue'),
      wordsInputsContainer: document.getElementById('words-inputs-container'),
      btnAddWordRow: document.getElementById('btn-add-word-row'),

      modalTrivia: document.getElementById('modal-trivia'),
      formTrivia: document.getElementById('form-trivia'),
      btnCloseTriviaModal: document.getElementById('btn-close-trivia-modal'),
      btnCancelTrivia: document.getElementById('btn-cancel-trivia'),
      inputTriviaId: document.getElementById('input-trivia-id'),
      inputTriviaText: document.getElementById('input-trivia-text'),
      selectTriviaTopic: document.getElementById('select-trivia-topic'),

      modalTrophy: document.getElementById('modal-trophy'),
      formTrophy: document.getElementById('form-trophy'),
      btnCloseTrophyModal: document.getElementById('btn-close-trophy-modal'),
      btnCancelTrophy: document.getElementById('btn-cancel-trophy'),
      inputTrophyId: document.getElementById('input-trophy-id'),
      inputTrophyIcon: document.getElementById('input-trophy-icon'),
      inputTrophyTitleText: document.getElementById('input-trophy-title-text'),
      inputTrophyDesc: document.getElementById('input-trophy-desc'),
      selectTrophyCriterion: document.getElementById('select-trophy-criterion'),
      inputTrophyTarget: document.getElementById('input-trophy-target'),

      // Módulo de Ranking & Podio
      dashRankingGameBtns: document.querySelectorAll('#dash-ranking-game-switcher .btn-ranking-game'),
      btnDashRankPodium: document.getElementById('btn-dash-rank-podium'),
      btnDashRankTable: document.getElementById('btn-dash-rank-table'),
      dashRankingViewPodium: document.getElementById('dash-ranking-view-podium'),
      dashRankingViewTable: document.getElementById('dash-ranking-view-table'),
      dashPodiumContainer: document.getElementById('dash-podium-container'),
      dashPodiumTitle: document.getElementById('dash-podium-title'),
      dashTopSabiosGrid: document.getElementById('dash-top-sabios-grid'),
      tbodyDashRanking: document.getElementById('tbody-dash-ranking'),
      filterDashRankingSearch: document.getElementById('filter-dash-ranking-search'),
      dashRankingCountLabel: document.getElementById('dash-ranking-count-label'),
      modalDashPlayerProfile: document.getElementById('modal-dashboard-player-profile'),
      btnCloseDashPpModal: document.getElementById('btn-close-dash-pp-modal'),
      btnCloseDashPpBtn: document.getElementById('btn-close-dash-pp-btn'),
      dashPpName: document.getElementById('dash-pp-name'),
      dashPpAvatar: document.getElementById('dash-pp-avatar'),
      dashPpTitle: document.getElementById('dash-pp-title'),
      dashPpCity: document.getElementById('dash-pp-city'),
      dashPpRank: document.getElementById('dash-pp-rank'),
      dashPpStars: document.getElementById('dash-pp-stars'),
      dashPpLevels: document.getElementById('dash-pp-levels'),
      dashPpWords: document.getElementById('dash-pp-words'),
      dashPpProverbs: document.getElementById('dash-pp-proverbs'),
      dashPpSpeed: document.getElementById('dash-pp-speed'),

      toast: document.getElementById('toast-notify')
    };
  }

  bindEvents() {
    // Navegación por Pestañas
    this.dom.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Enlaces directos a pestañas en Overview
    document.querySelectorAll('[data-go-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.goTab);
      });
    });

    // Filtros de Niveles
    if (this.dom.filterLevelsSearch) {
      this.dom.filterLevelsSearch.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value.toLowerCase();
        this.renderLevelsTable();
      });
    }

    if (this.dom.categoryChips) {
      this.dom.categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
          this.dom.categoryChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.state.categoryFilter = chip.dataset.cat;
          this.renderLevelsTable();
        });
      });
    }

    // Ordenación de Niveles (Selector y Encabezados de Tabla)
    if (this.dom.selectLevelsSort) {
      this.dom.selectLevelsSort.addEventListener('change', (e) => {
        const parts = e.target.value.split('-');
        this.state.levelSortBy = parts[0];
        this.state.levelSortOrder = parts[1] || 'desc';
        this.updateSortHeaderArrows();
        this.renderLevelsTable();
      });
    }

    if (this.dom.thSortDate) {
      this.dom.thSortDate.addEventListener('click', () => {
        if (this.state.levelSortBy === 'date') {
          this.state.levelSortOrder = this.state.levelSortOrder === 'desc' ? 'asc' : 'desc';
        } else {
          this.state.levelSortBy = 'date';
          this.state.levelSortOrder = 'desc';
        }
        this.updateSortHeaderArrows();
        this.renderLevelsTable();
      });
    }

    if (this.dom.thSortTitle) {
      this.dom.thSortTitle.addEventListener('click', () => {
        if (this.state.levelSortBy === 'title') {
          this.state.levelSortOrder = this.state.levelSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.state.levelSortBy = 'title';
          this.state.levelSortOrder = 'asc';
        }
        this.updateSortHeaderArrows();
        this.renderLevelsTable();
      });
    }

    // Filtro de Curiosidades
    if (this.dom.filterTriviasSearch) {
      this.dom.filterTriviasSearch.addEventListener('input', (e) => {
        this.renderTrivias(e.target.value.toLowerCase());
      });
    }

    // Filtro de Trofeos
    if (this.dom.filterTrophiesSearch) {
      this.dom.filterTrophiesSearch.addEventListener('input', (e) => {
        this.renderTrophies(e.target.value.toLowerCase());
      });
    }

    // Filtro de Jugadores
    if (this.dom.filterUsersSearch) {
      this.dom.filterUsersSearch.addEventListener('input', (e) => {
        this.renderUsersTable(e.target.value.toLowerCase());
      });
    }

    // Selector de métrica en Leaderboard
    if (this.dom.leaderboardMetricChips) {
      this.dom.leaderboardMetricChips.forEach(chip => {
        chip.addEventListener('click', () => {
          this.dom.leaderboardMetricChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.state.leaderboardMetric = chip.dataset.metric;
          this.renderLeaderboard();
        });
      });
    }

    // Filtros de Importador
    if (this.dom.filterImporterSearch) {
      this.dom.filterImporterSearch.addEventListener('input', (e) => {
        this.state.importerSearchQuery = e.target.value.toLowerCase().trim();
        this.renderImporter();
      });
    }

    if (this.dom.importerCategoryChips) {
      this.dom.importerCategoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
          this.dom.importerCategoryChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.state.importerCategoryFilter = chip.dataset.importerCat;
          this.renderImporter();
        });
      });
    }

    if (this.dom.btnImportAllTopics) {
      this.dom.btnImportAllTopics.addEventListener('click', () => this.importAllTopics());
    }

    // Botones de Crear
    if (this.dom.btnCreateLevel) this.dom.btnCreateLevel.addEventListener('click', () => this.openLevelModal());
    if (this.dom.btnAddLevelTop) this.dom.btnAddLevelTop.addEventListener('click', () => this.openLevelModal());
    if (this.dom.btnAddTrivia) this.dom.btnAddTrivia.addEventListener('click', () => this.openTriviaModal());
    if (this.dom.btnAddTrophy) this.dom.btnAddTrophy.addEventListener('click', () => this.openTrophyModal());

    // Cierre de Modales
    if (this.dom.btnCloseLevelModal) this.dom.btnCloseLevelModal.addEventListener('click', () => this.closeModal(this.dom.modalLevel));
    if (this.dom.btnCancelLevel) this.dom.btnCancelLevel.addEventListener('click', () => this.closeModal(this.dom.modalLevel));
    if (this.dom.btnCloseTriviaModal) this.dom.btnCloseTriviaModal.addEventListener('click', () => this.closeModal(this.dom.modalTrivia));
    if (this.dom.btnCancelTrivia) this.dom.btnCancelTrivia.addEventListener('click', () => this.closeModal(this.dom.modalTrivia));
    if (this.dom.btnCloseTrophyModal) this.dom.btnCloseTrophyModal.addEventListener('click', () => this.closeModal(this.dom.modalTrophy));
    if (this.dom.btnCancelTrophy) this.dom.btnCancelTrophy.addEventListener('click', () => this.closeModal(this.dom.modalTrophy));

    // Añadir fila de palabra en Modal de Nivel
    if (this.dom.btnAddWordRow) {
      this.dom.btnAddWordRow.addEventListener('click', () => {
        this.addWordInputRow();
      });
    }

    // Envío de Formularios
    if (this.dom.formLevel) {
      this.dom.formLevel.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveLevel();
      });
    }

    if (this.dom.formTrivia) {
      this.dom.formTrivia.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveTrivia();
      });
    }

    if (this.dom.formTrophy) {
      this.dom.formTrophy.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveTrophy();
      });
    }

    // Sincronización y Sembrado
    if (this.dom.btnSyncAll) {
      this.dom.btnSyncAll.addEventListener('click', () => {
        this.dom.btnSyncAll.classList.add('rotating');
        this.loadAllData().finally(() => {
          setTimeout(() => this.dom.btnSyncAll.classList.remove('rotating'), 500);
          this.showToast('✅ Datos sincronizados con Firebase');
        });
      });
    }

    if (this.dom.btnExportBackup) {
      this.dom.btnExportBackup.addEventListener('click', () => this.exportBackupJson());
    }

    if (this.dom.btnTriggerSeed) {
      this.dom.btnTriggerSeed.addEventListener('click', () => this.seedFirestoreWithDefaults());
    }

    if (this.dom.btnQuickSeed) {
      this.dom.btnQuickSeed.addEventListener('click', () => this.seedFirestoreWithDefaults());
    }

    // Patrocinio Institucional (AEGLE)
    if (this.dom.toggleSponsorshipActive) {
      this.dom.toggleSponsorshipActive.addEventListener('change', () => {
        const isEnabled = this.dom.toggleSponsorshipActive.checked;
        this.state.sponsorship.enabled = isEnabled;
        this.updateSponsorshipUI();
        this.saveSponsorshipSettings(true);
      });
    }

    if (this.dom.inputSponsorLogo && this.dom.previewSponsorLogo) {
      this.dom.inputSponsorLogo.addEventListener('input', (e) => {
        this.dom.previewSponsorLogo.src = e.target.value.trim() || '/AEGLE.png';
      });
    }

    if (this.dom.formSponsorshipSettings) {
      this.dom.formSponsorshipSettings.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSponsorshipSettings(true);
      });
    }

    // Conmutador de Juegos en Ranking (Global, ApalabraGE, El Ahorcado)
    if (this.dom.dashRankingGameBtns) {
      this.dom.dashRankingGameBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const game = e.currentTarget.dataset.game || 'global';
          this.switchDashboardRankingGame(game);
        });
      });
    }

    // Modalidades de Ranking (Podio vs Tabla Top 50)
    if (this.dom.btnDashRankPodium && this.dom.btnDashRankTable) {
      this.dom.btnDashRankPodium.addEventListener('click', () => {
        this.dom.btnDashRankPodium.classList.add('active');
        this.dom.btnDashRankTable.classList.remove('active');
        if (this.dom.dashRankingViewPodium) this.dom.dashRankingViewPodium.style.display = 'block';
        if (this.dom.dashRankingViewTable) this.dom.dashRankingViewTable.style.display = 'none';
      });

      this.dom.btnDashRankTable.addEventListener('click', () => {
        this.dom.btnDashRankTable.classList.add('active');
        this.dom.btnDashRankPodium.classList.remove('active');
        if (this.dom.dashRankingViewPodium) this.dom.dashRankingViewPodium.style.display = 'none';
        if (this.dom.dashRankingViewTable) this.dom.dashRankingViewTable.style.display = 'block';
      });
    }

    // Buscador en Tiempo Real de Ranking
    if (this.dom.filterDashRankingSearch) {
      this.dom.filterDashRankingSearch.addEventListener('input', (e) => {
        this.state.rankingSearchQuery = e.target.value.toLowerCase();
        this.renderDashboardRankingTable();
      });
    }

    // Cierre de Modal de Perfil de Sabio / Jugador
    if (this.dom.btnCloseDashPpModal) {
      this.dom.btnCloseDashPpModal.addEventListener('click', () => {
        if (this.dom.modalDashPlayerProfile) this.dom.modalDashPlayerProfile.classList.remove('active');
      });
    }

    if (this.dom.btnCloseDashPpBtn) {
      this.dom.btnCloseDashPpBtn.addEventListener('click', () => {
        if (this.dom.modalDashPlayerProfile) this.dom.modalDashPlayerProfile.classList.remove('active');
      });
    }
  }

  switchTab(tabKey) {
    this.state.currentTab = tabKey;

    this.dom.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabKey);
    });

    this.dom.tabViews.forEach(view => {
      view.classList.toggle('active', view.id === `view-${tabKey}`);
    });

    const titles = {
      overview: { title: "Resumen General", sub: "Monitoreo de contenido cultural, palabras y jugadores" },
      levels: { title: "Gestión de Niveles y Palabras", sub: "Crea y actualiza los retos léxicos de Guinea Ecuatorial" },
      categories: { title: "Categorías Culturales", sub: "Gastronomía, Geografía, Cultura y Modismos locales" },
      trophies: { title: "🏆 Trofeos, Logros y Tabla de Récords", sub: "Personaliza las medallas, los rangos de honor y el salón de la fama" },
      trivias: { title: "¿Sabías qué...? (Curiosidades)", sub: "Banco de píldoras culturales que se muestran a los jugadores" },
      users: { title: "Jugadores y Estadísticas", sub: "Perfiles sincronizados en Cloud Firestore y logros" },
      ranking: { title: "👑 Salón de Honor y Ranking Global", sub: "Clasificación oficial de sabiduría en dos modalidades: Podio y Tabla Top 50" },
      backup: { title: "Base de Datos y Copias de Seguridad", sub: "Exporta respaldos JSON e inicializa colecciones" },
      sponsorship: { title: "🤝 Configuración de Patrocinio Institucional", sub: "Controla si se muestran o se ocultan los logotipos y menciones de la AEGLE en la app" },
      importer: { title: "📥 Importador Masivo — Libro Pasatiempos GE", sub: "Catálogo de 45 temas y más de 850 términos autóctonos listos para convertir en niveles" }
    };

    if (titles[tabKey]) {
      this.dom.pageTitle.textContent = titles[tabKey].title;
      this.dom.pageSubtitle.textContent = titles[tabKey].sub;
    }
  }

  async checkFirestoreConnection() {
    try {
      this.dom.firebaseProjectName.textContent = "Conectando a apalabrage...";
      // Consulta de prueba
      await getDocs(collection(db, 'categories'));
      this.state.isFirestoreConnected = true;
      this.dom.firebaseProjectName.textContent = "Conectado: apalabrage (europe-west1)";
      const indicator = this.dom.firebaseStatusBadge.querySelector('.status-indicator');
      if (indicator) indicator.className = 'status-indicator online';
    } catch (err) {
      console.warn('Firestore offline o reglas restringidas:', err);
      this.dom.firebaseProjectName.textContent = "Modo Local / Caché Activa";
    }
  }

  /* ================= CARGA DE DATOS ================= */

  async loadAllData() {
    await Promise.all([
      this.loadLevels(),
      this.loadCategories(),
      this.loadTrivias(),
      this.loadUsers(),
      this.loadTrophies(),
      this.loadRanks(),
      this.loadSponsorshipSettings()
    ]);

    this.updateKPIs();
    this.renderOverview();
    this.renderLevelsTable();
    this.renderCategoriesGrid();
    this.renderTrophies();
    this.renderRanks();
    this.renderLeaderboard();
    this.renderTrivias();
    this.renderUsersTable();
    this.renderDashboardRanking();
    this.renderImporter();
  }

  extractDefaultLevels() {
    const list = [];
    (defaultLevelsData.categories || []).forEach(cat => {
      (cat.levels || []).forEach(lvl => {
        list.push({
          ...lvl,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon
        });
      });
    });
    return list;
  }

  async loadLevels() {
    try {
      const snap = await getDocs(collection(db, 'levels'));
      if (!snap.empty) {
        this.state.levels = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.saveLocalBackup();
      } else {
        const cached = localStorage.getItem('apalabrage_cached_levels');
        if (cached) {
          this.state.levels = JSON.parse(cached);
        } else {
          this.state.levels = this.extractDefaultLevels();
        }
      }
    } catch (err) {
      console.warn('Error cargando niveles de Firestore, usando locales/caché:', err);
      const cached = localStorage.getItem('apalabrage_cached_levels');
      if (cached) {
        try {
          this.state.levels = JSON.parse(cached);
        } catch (e) {
          this.state.levels = this.extractDefaultLevels();
        }
      } else {
        this.state.levels = this.extractDefaultLevels();
      }
    }

    if (this.dom.navCountLevels) this.dom.navCountLevels.textContent = this.state.levels.length;
  }

  async loadCategories() {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (!snap.empty) {
        this.state.categories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        this.state.categories = defaultLevelsData.categories || [];
      }
    } catch (err) {
      this.state.categories = defaultLevelsData.categories || [];
    }

    if (this.dom.navCountCategories) this.dom.navCountCategories.textContent = this.state.categories.length;
    this.updateCategorySelectOptions();
  }

  updateCategorySelectOptions() {
    if (!this.dom.selectLevelCategory) return;
    if (Array.isArray(this.state.categories) && this.state.categories.length > 0) {
      const currentVal = this.dom.selectLevelCategory.value;
      this.dom.selectLevelCategory.innerHTML = '';
      this.state.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.icon || '🇬🇶'} ${cat.name}`;
        this.dom.selectLevelCategory.appendChild(opt);
      });
      if (currentVal) {
        this.dom.selectLevelCategory.value = currentVal;
      }
    }
  }

  async loadTrivias() {
    try {
      const snap = await getDocs(collection(db, 'trivias'));
      if (!snap.empty) {
        this.state.trivias = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (err) {
      console.warn('Error cargando trivias:', err);
    }

    if (this.dom.navCountTrivias) this.dom.navCountTrivias.textContent = this.state.trivias.length;
  }

  async loadUsers() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        this.state.users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        // Usuario local si no hay usuarios en Firestore aún
        const localProf = localStorage.getItem('apalabrage_user_profile');
        if (localProf) {
          try {
            const p = JSON.parse(localProf);
            this.state.users = [{ id: 'user-local', ...p, updatedAt: new Date().toISOString() }];
          } catch(e) {}
        }
      }
    } catch (err) {
      console.warn('Error cargando usuarios:', err);
    }

    if (this.dom.navCountUsers) this.dom.navCountUsers.textContent = this.state.users.length;
    if (this.dom.usersCountInfo) this.dom.usersCountInfo.textContent = `${this.state.users.length} jugadores registrados`;
  }

  async loadTrophies() {
    try {
      const snap = await getDocs(collection(db, 'achievements'));
      if (!snap.empty) {
        this.state.trophies = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (err) {
      console.warn('Error cargando trofeos de Firestore, usando locales:', err);
    }

    if (this.dom.navCountTrophies) this.dom.navCountTrophies.textContent = this.state.trophies.length;
    if (this.dom.statTotalTrophies) this.dom.statTotalTrophies.textContent = this.state.trophies.length;
  }

  async loadRanks() {
    try {
      const snap = await getDocs(collection(db, 'ranks'));
      if (!snap.empty) {
        this.state.ranks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (err) {
      console.warn('Error cargando rangos:', err);
    }
  }

  /* ================= ACTUALIZACIÓN DE INTERFAZ ================= */

  updateKPIs() {
    const totalLevels = this.state.levels.length;
    let totalWords = 0;
    this.state.levels.forEach(lvl => {
      if (Array.isArray(lvl.words)) totalWords += lvl.words.length;
    });

    if (this.dom.statTotalLevels) this.dom.statTotalLevels.textContent = totalLevels;
    if (this.dom.statTotalWords) this.dom.statTotalWords.textContent = totalWords;
    if (this.dom.statTotalTrivias) this.dom.statTotalTrivias.textContent = this.state.trivias.length;
    if (this.dom.statTotalUsers) this.dom.statTotalUsers.textContent = this.state.users.length;
    if (this.dom.statTotalTrophies) this.dom.statTotalTrophies.textContent = this.state.trophies.length;
    if (this.dom.navCountTrophies) this.dom.navCountTrophies.textContent = this.state.trophies.length;
  }

  renderOverview() {
    // Mini tabla niveles
    if (this.dom.tableOverviewLevels) {
      this.dom.tableOverviewLevels.innerHTML = '';
      const recent = this.state.levels.slice(0, 5);
      recent.forEach(lvl => {
        const tr = document.createElement('tr');
        const wordsStr = (lvl.words || []).map(w => w.word || w).slice(0, 3).join(', ');
        tr.innerHTML = `
          <td><strong>${lvl.title}</strong></td>
          <td><span class="cat-tag cat-${lvl.categoryId}">${lvl.categoryName || lvl.categoryId}</span></td>
          <td><span style="font-size:0.8rem; color:#94a3b8;">${wordsStr}...</span></td>
        `;
        this.dom.tableOverviewLevels.appendChild(tr);
      });
    }

    // Mini tabla usuarios
    if (this.dom.tableOverviewUsers) {
      this.dom.tableOverviewUsers.innerHTML = '';
      const recentUsers = this.state.users.slice(0, 5);
      recentUsers.forEach(u => {
        const tr = document.createElement('tr');
        const avatarHtml = (u.avatar && (u.avatar.startsWith('data:') || u.avatar.startsWith('http')))
          ? `<img src="${u.avatar}" />`
          : (u.avatar || '🌳');

        tr.innerHTML = `
          <td style="display:flex; align-items:center; gap:8px;">
            <div class="user-avatar-cell" style="width:28px; height:28px; font-size:0.9rem;">${avatarHtml}</div>
            <span>${u.name || 'Explorador'}</span>
          </td>
          <td><span style="color:#fbbf24; font-weight:700;">⭐ ${u.stars || 0}</span></td>
          <td>${u.levelsCompleted || 0} niveles</td>
        `;
        this.dom.tableOverviewUsers.appendChild(tr);
      });
    }
  }

  renderLevelsTable() {
    if (!this.dom.tableLevelsBody) return;
    this.dom.tableLevelsBody.innerHTML = '';

    const filtered = this.state.levels.filter(lvl => {
      const matchCat = this.state.categoryFilter === 'all' || lvl.categoryId === this.state.categoryFilter;
      const search = this.state.searchQuery;
      const matchSearch = !search || 
        (lvl.title && lvl.title.toLowerCase().includes(search)) ||
        (lvl.clue && lvl.clue.toLowerCase().includes(search)) ||
        ((lvl.words || []).some(w => (w.word || w).toLowerCase().includes(search)));
      return matchCat && matchSearch;
    });

    // Función auxiliar para obtener timestamp determinista de creación
    const getLevelTimestamp = (lvl, idx = 0) => {
      if (lvl.createdAt) {
        const t = new Date(lvl.createdAt).getTime();
        if (!isNaN(t)) return t;
      }
      if (lvl.updatedAt) {
        const t = new Date(lvl.updatedAt).getTime();
        if (!isNaN(t)) return t;
      }
      if (lvl.id && /^\d{10,15}$/.test(String(lvl.id))) {
        return Number(lvl.id);
      }
      const numMatch = String(lvl.id || '').match(/\d+/);
      const numVal = numMatch ? parseInt(numMatch[0], 10) : idx;
      return 1700000000000 + numVal;
    };

    // Ordenación en ambos sentidos (Fecha o Título Alfabético)
    filtered.sort((a, b) => {
      if (this.state.levelSortBy === 'title') {
        const titleA = (a.title || '').trim();
        const titleB = (b.title || '').trim();
        const cmp = titleA.localeCompare(titleB, 'es', { sensitivity: 'base', numeric: true });
        return this.state.levelSortOrder === 'desc' ? -cmp : cmp;
      } else {
        const timeA = getLevelTimestamp(a);
        const timeB = getLevelTimestamp(b);
        return this.state.levelSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
    });

    this.updateSortHeaderArrows();

    if (filtered.length === 0) {
      this.dom.tableLevelsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:#94a3b8;">No se encontraron niveles que coincidan con la búsqueda.</td></tr>`;
      return;
    }

    filtered.forEach((lvl, idx) => {
      const tr = document.createElement('tr');
      const wordsList = (lvl.words || []).map(w => {
        const wordText = typeof w === 'string' ? w : w.word;
        return `<span class="word-badge">${wordText}</span>`;
      }).join(' ');

      const rawTime = getLevelTimestamp(lvl, idx);
      let dateBadge = '';
      if (rawTime > 1700000100000) {
        const d = new Date(rawTime);
        const dStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const hStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        dateBadge = `<div style="font-size:0.68rem; color:#64748b; font-weight:500; margin-top:2px;">📅 ${dStr} ${hStr}</div>`;
      }

      tr.innerHTML = `
        <td style="font-weight:700; color:#94a3b8; font-size:0.84rem;">
          <div>#${lvl.id || (idx + 1)}</div>
          ${dateBadge}
        </td>
        <td>
          <strong style="color:#f8fafc; font-size:0.95rem;">${lvl.title}</strong>
        </td>
        <td>
          <span class="cat-tag cat-${lvl.categoryId}">
            ${lvl.categoryIcon || '🇬🇶'} ${lvl.categoryName || lvl.categoryId}
          </span>
        </td>
        <td style="color:#94a3b8; font-size:0.85rem;">${lvl.clue || '-'}</td>
        <td>
          <div class="words-pill-list">${wordsList}</div>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="table-action-btn add-next btn-add-next-level" data-id="${lvl.id}" title="Crear siguiente nivel derivado (misma categoría y pista)">➕</button>
          <button class="table-action-btn btn-edit-level" data-id="${lvl.id}" title="Editar Nivel">✏️</button>
          <button class="table-action-btn delete btn-delete-level" data-id="${lvl.id}" title="Eliminar Nivel">🗑️</button>
        </td>
      `;

      // Eventos de creación derivada, edición y borrado
      const btnAddNext = tr.querySelector('.btn-add-next-level');
      const btnEdit = tr.querySelector('.btn-edit-level');
      const btnDelete = tr.querySelector('.btn-delete-level');

      if (btnAddNext) btnAddNext.addEventListener('click', () => this.openCreateNextLevelModal(lvl));
      if (btnEdit) btnEdit.addEventListener('click', () => this.openLevelModal(lvl.id));
      if (btnDelete) btnDelete.addEventListener('click', () => this.confirmDeleteLevel(lvl.id, lvl.title));

      this.dom.tableLevelsBody.appendChild(tr);
    });
  }

  updateSortHeaderArrows() {
    if (this.dom.selectLevelsSort) {
      this.dom.selectLevelsSort.value = `${this.state.levelSortBy}-${this.state.levelSortOrder}`;
    }

    if (this.dom.thSortDate && this.dom.arrowSortDate) {
      if (this.state.levelSortBy === 'date') {
        this.dom.thSortDate.classList.add('active-sort');
        this.dom.arrowSortDate.textContent = this.state.levelSortOrder === 'desc' ? '▼' : '▲';
      } else {
        this.dom.thSortDate.classList.remove('active-sort');
        this.dom.arrowSortDate.textContent = '↕';
      }
    }

    if (this.dom.thSortTitle && this.dom.arrowSortTitle) {
      if (this.state.levelSortBy === 'title') {
        this.dom.thSortTitle.classList.add('active-sort');
        this.dom.arrowSortTitle.textContent = this.state.levelSortOrder === 'desc' ? '▼' : '▲';
      } else {
        this.dom.thSortTitle.classList.remove('active-sort');
        this.dom.arrowSortTitle.textContent = '↕';
      }
    }
  }

  renderCategoriesGrid() {
    if (!this.dom.categoriesAdminList) return;
    this.dom.categoriesAdminList.innerHTML = '';

    this.state.categories.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'cat-admin-card';
      const levelCount = this.state.levels.filter(l => l.categoryId === cat.id).length;

      card.innerHTML = `
        <div class="cat-admin-top">
          <span class="cat-admin-icon">${cat.icon}</span>
          <div>
            <h4 class="cat-admin-name">${cat.name}</h4>
            <span class="cat-tag cat-${cat.id}">ID: ${cat.id}</span>
          </div>
        </div>
        <p class="cat-admin-desc">${cat.description || 'Categoría del acervo cultural ecuatoguineano.'}</p>
        <div class="cat-admin-meta">
          <span><strong>${levelCount}</strong> niveles creados</span>
          <span style="color:#38bdf8;">✓ Sincronizado</span>
        </div>
      `;
      this.dom.categoriesAdminList.appendChild(card);
    });
  }

  renderTrophies(searchFilter = '') {
    if (!this.dom.trophiesAdminList) return;
    this.dom.trophiesAdminList.innerHTML = '';

    const list = this.state.trophies.filter(tr => {
      return !searchFilter || tr.title.toLowerCase().includes(searchFilter) || tr.desc.toLowerCase().includes(searchFilter);
    });

    if (list.length === 0) {
      this.dom.trophiesAdminList.innerHTML = `<div style="grid-column: span 2; text-align:center; padding:30px; color:#94a3b8;">No se encontraron trofeos que coincidan con la búsqueda.</div>`;
      return;
    }

    list.forEach(tr => {
      const card = document.createElement('div');
      card.className = 'trophy-admin-card';

      const criterionLabels = {
        first_word: '1ª Palabra',
        category_gastro: 'Gastronomía Típica',
        category_geo: 'Geografía y Lugares',
        category_cultura: 'Cultura & Tradición',
        category_modismos: 'Modismos & Palaveras',
        words_count: `${tr.target || 5} Palabras`,
        streak_days: `${tr.target || 3} Días de Racha`,
        stars_count: `${tr.target || 10} Estrellas`
      };
      const critText = criterionLabels[tr.criterion] || tr.criterion || 'Reto Cultural';

      card.innerHTML = `
        <div class="trophy-card-header">
          <div class="trophy-icon-wrap">${tr.icon || '🏆'}</div>
          <div class="trophy-header-info">
            <h4 class="trophy-title">${tr.title}</h4>
            <span class="trophy-criterion-badge">🎯 ${critText}</span>
          </div>
        </div>
        <p class="trophy-desc">${tr.desc}</p>
        <div class="trophy-card-actions">
          <button class="table-action-btn btn-edit-trophy" data-id="${tr.id}" title="Editar Trofeo">✏️ Editar</button>
          <button class="table-action-btn delete btn-delete-trophy" data-id="${tr.id}" title="Eliminar Trofeo">🗑️</button>
        </div>
      `;

      card.querySelector('.btn-edit-trophy').addEventListener('click', () => this.openTrophyModal(tr.id));
      card.querySelector('.btn-delete-trophy').addEventListener('click', () => this.confirmDeleteTrophy(tr.id));

      this.dom.trophiesAdminList.appendChild(card);
    });
  }

  renderRanks() {
    if (!this.dom.ranksAdminList) return;
    this.dom.ranksAdminList.innerHTML = '';

    this.state.ranks.forEach(rk => {
      const card = document.createElement('div');
      card.className = 'rank-admin-card';
      card.innerHTML = `
        <div class="rank-emblem">${rk.emblem}</div>
        <div class="rank-info">
          <h4 class="rank-title">${rk.title}</h4>
          <p class="rank-requirement">🔓 ${rk.requirement}</p>
        </div>
      `;
      this.dom.ranksAdminList.appendChild(card);
    });
  }

  renderLeaderboard() {
    if (!this.dom.tbodyLeaderboard) return;
    this.dom.tbodyLeaderboard.innerHTML = '';

    const metric = this.state.leaderboardMetric || 'stars';
    const sortedUsers = [...this.state.users].sort((a, b) => {
      if (metric === 'words') return (b.wordsFound || 0) - (a.wordsFound || 0);
      if (metric === 'streak') return (b.streakDays || 0) - (a.streakDays || 0);
      return (b.stars || 0) - (a.stars || 0);
    });

    if (sortedUsers.length === 0) {
      this.dom.tbodyLeaderboard.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#94a3b8;">No hay datos de exploradores sincronizados en el Salón de la Fama.</td></tr>`;
      return;
    }

    sortedUsers.forEach((u, idx) => {
      const tr = document.createElement('tr');
      let medalHtml = `#${idx + 1}`;
      if (idx === 0) medalHtml = `<span class="medal-gold">🥇 #1</span>`;
      else if (idx === 1) medalHtml = `<span class="medal-silver">🥈 #2</span>`;
      else if (idx === 2) medalHtml = `<span class="medal-bronze">🥉 #3</span>`;

      const avatarHtml = (u.avatar && (u.avatar.startsWith('data:') || u.avatar.startsWith('http')))
        ? `<img src="${u.avatar}" />`
        : (u.avatar || '🌳');

      tr.innerHTML = `
        <td class="medal-cell">${medalHtml}</td>
        <td><div class="user-avatar-cell">${avatarHtml}</div></td>
        <td><strong>${u.name || 'Explorador Guineano'}</strong></td>
        <td><span style="color:#fde047; font-weight:700; font-size:0.8rem;">${u.title || 'Guardián de la Ceiba'}</span></td>
        <td><strong style="color:#fbbf24;">⭐ ${u.stars || 0}</strong></td>
        <td><span style="color:#38bdf8; font-weight:700;">${u.wordsFound || 0}</span></td>
        <td>🔥 ${u.streakDays || 1} días</td>
        <td>${u.levelsCompleted || 0} niveles</td>
      `;
      this.dom.tbodyLeaderboard.appendChild(tr);
    });
  }

  renderTrivias(searchFilter = '') {
    if (!this.dom.triviasAdminList) return;
    this.dom.triviasAdminList.innerHTML = '';

    const list = this.state.trivias.filter(t => {
      return !searchFilter || t.text.toLowerCase().includes(searchFilter) || (t.topic && t.topic.toLowerCase().includes(searchFilter));
    });

    if (list.length === 0) {
      this.dom.triviasAdminList.innerHTML = `<div style="grid-column: span 2; text-align:center; padding:30px; color:#94a3b8;">No se encontraron curiosidades.</div>`;
      return;
    }

    list.forEach(t => {
      const card = document.createElement('div');
      card.className = 'trivia-admin-card';
      card.innerHTML = `
        <span class="trivia-topic-tag">${t.topic || 'General'}</span>
        <p class="trivia-admin-text">${t.text}</p>
        <div class="trivia-admin-actions">
          <button class="table-action-btn btn-edit-trivia" data-id="${t.id}" title="Editar">✏️</button>
          <button class="table-action-btn delete btn-delete-trivia" data-id="${t.id}" title="Eliminar">🗑️</button>
        </div>
      `;

      card.querySelector('.btn-edit-trivia').addEventListener('click', () => this.openTriviaModal(t.id));
      card.querySelector('.btn-delete-trivia').addEventListener('click', () => this.confirmDeleteTrivia(t.id));

      this.dom.triviasAdminList.appendChild(card);
    });
  }

  renderUsersTable(searchFilter = '') {
    if (!this.dom.tableUsersBody) return;
    this.dom.tableUsersBody.innerHTML = '';

    const list = this.state.users.filter(u => {
      return !searchFilter || (u.name && u.name.toLowerCase().includes(searchFilter));
    });

    if (list.length === 0) {
      this.dom.tableUsersBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:#94a3b8;">No hay jugadores registrados aún.</td></tr>`;
      return;
    }

    list.forEach(u => {
      const tr = document.createElement('tr');
      const avatarHtml = (u.avatar && (u.avatar.startsWith('data:') || u.avatar.startsWith('http')))
        ? `<img src="${u.avatar}" />`
        : (u.avatar || '🌳');

      const updatedStr = u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : 'Hoy';
      const speedStr = u.fastestLevelTime ? `⚡ ${u.fastestLevelTime}s` : (u.timeAttackHighScore ? `⚡ ${u.timeAttackHighScore} pts` : '--');

      tr.innerHTML = `
        <td><div class="user-avatar-cell">${avatarHtml}</div></td>
        <td><strong>${u.name || 'Explorador'}</strong></td>
        <td><span style="display:inline-flex; align-items:center; gap:3px; background:rgba(16,185,129,0.18); color:#6ee7b7; border:1px solid rgba(16,185,129,0.35); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600;">📍 ${u.city || 'Malabo'}</span></td>
        <td><span style="color:#fde047; font-size:0.8rem; font-weight:700;">${u.title || 'Guardián de la Ceiba'}</span></td>
        <td><span style="color:#fbbf24; font-weight:800;">⭐ ${u.stars || 0}</span></td>
        <td>${u.levelsCompleted || 0}</td>
        <td>${u.wordsFound || 0}</td>
        <td style="color:#6ee7b7; font-weight:700;">${speedStr}</td>
        <td>🔥 ${u.streakDays || 1} días</td>
        <td style="color:#94a3b8; font-size:0.8rem;">${updatedStr}</td>
      `;
      this.dom.tableUsersBody.appendChild(tr);
    });
  }

  /* ================= MÓDULO DE RANKING Y SALÓN DE HONOR ================= */

  switchDashboardRankingGame(game = 'global') {
    this.state.rankingGameFilter = game;
    if (this.dom.dashRankingGameBtns) {
      this.dom.dashRankingGameBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.game === game);
      });
    }
    if (this.dom.dashPodiumTitle) {
      if (game === 'apalabrage') {
        this.dom.dashPodiumTitle.textContent = '🔤 Sabios de A Dedo (Niveles y Palabras)';
      } else if (game === 'hangman') {
        this.dom.dashPodiumTitle.textContent = '📜 Maestros de El Refranero (Proverbios Descifrados)';
      } else {
        this.dom.dashPodiumTitle.textContent = '👑 Los Tres Grandes Sabios Culturales';
      }
    }
    this.renderDashboardRanking();
  }

  getEnrichedRankingUsers() {
    const guineanRoster = [
      { name: 'Leandro Mbomio', avatar: '🗿', city: 'Malabo', stars: 98, wordsFound: 85, levelsCompleted: 25, proverbsSolved: 30, timeAttackHighScore: 1200, title: 'Gran Escultor & Sabio Nacional' },
      { name: 'Martiniano Ele', avatar: '✍️', city: 'Bata', stars: 94, wordsFound: 80, levelsCompleted: 24, proverbsSolved: 28, timeAttackHighScore: 1150, title: 'Cronista Mayor de Río Muni' },
      { name: 'Leoncio Evita', avatar: '📖', city: 'Udubuamlange', stars: 90, wordsFound: 76, levelsCompleted: 23, proverbsSolved: 27, timeAttackHighScore: 1100, title: 'Pionero de la Novela Guineana' },
      { name: 'Nchama Mangue', avatar: '👑', city: 'Malabo', stars: 58, wordsFound: 52, levelsCompleted: 18, proverbsSolved: 24, timeAttackHighScore: 920, title: 'Académica de Honor' },
      { name: 'Mba Ondo', avatar: '🐆', city: 'Bata', stars: 54, wordsFound: 48, levelsCompleted: 16, proverbsSolved: 22, timeAttackHighScore: 870, title: 'Guardián del Bosque Fang' },
      { name: 'Mari Paz Abaha', avatar: '🌺', city: 'Ebebiyín', stars: 50, wordsFound: 45, levelsCompleted: 15, proverbsSolved: 20, timeAttackHighScore: 810, title: 'Maestra de Tradiciones' },
      { name: 'Cándido Esono', avatar: '🛶', city: 'Luba', stars: 47, wordsFound: 41, levelsCompleted: 14, proverbsSolved: 19, timeAttackHighScore: 760, title: 'Navegante de la Bahía' },
      { name: 'Esperanza Bolekia', avatar: '🌋', city: 'Mongomo', stars: 44, wordsFound: 39, levelsCompleted: 13, proverbsSolved: 18, timeAttackHighScore: 710, title: 'Erudita Bubi & Fang' },
      { name: 'Juanita Mayé', avatar: '🌳', city: 'Madrid', stars: 40, wordsFound: 35, levelsCompleted: 12, proverbsSolved: 16, timeAttackHighScore: 650, title: 'Embajadora Lingüística' },
      { name: 'Donato Ndongo', avatar: '📚', city: 'Bata', stars: 39, wordsFound: 34, levelsCompleted: 12, proverbsSolved: 15, timeAttackHighScore: 630, title: 'Maestro de las Letras' },
      { name: 'Cristina Mikue', avatar: '🌸', city: 'Barcelona', stars: 37, wordsFound: 33, levelsCompleted: 11, proverbsSolved: 14, timeAttackHighScore: 600, title: 'Narradora del Mvet' },
      { name: 'Joaquín Mbomio', avatar: '🌊', city: 'Annobón', stars: 36, wordsFound: 31, levelsCompleted: 11, proverbsSolved: 13, timeAttackHighScore: 580, title: 'Voz del Fa d’Ambô' },
      { name: 'Regina Nse', avatar: '🌿', city: 'Evinayong', stars: 35, wordsFound: 30, levelsCompleted: 10, proverbsSolved: 12, timeAttackHighScore: 560, title: 'Sabia de Plantas Medicinales' },
      { name: 'Silverio Ncogo', avatar: '🦁', city: 'Valencia', stars: 33, wordsFound: 29, levelsCompleted: 10, proverbsSolved: 11, timeAttackHighScore: 540, title: 'Defensor de la Lengua' },
      { name: 'Teresa Bindang', avatar: '🍲', city: 'Riaba', stars: 32, wordsFound: 28, levelsCompleted: 9, proverbsSolved: 10, timeAttackHighScore: 520, title: 'Cocinera del Pepesup Real' },
      { name: 'Diosdado Mocache', avatar: '🦅', city: 'Libreville', stars: 31, wordsFound: 27, levelsCompleted: 9, proverbsSolved: 10, timeAttackHighScore: 500, title: 'Explorador Ecuatoguineano' },
      { name: 'Inmaculada Obono', avatar: '💫', city: 'Malabo', stars: 30, wordsFound: 26, levelsCompleted: 9, proverbsSolved: 9, timeAttackHighScore: 480, title: 'Líder Juvenil de Palabras' },
      { name: 'Anacleto Bokesa', avatar: '🎯', city: 'Bata', stars: 29, wordsFound: 25, levelsCompleted: 8, proverbsSolved: 8, timeAttackHighScore: 460, title: 'Tirador de Enigmas' },
      { name: 'Fátima Nzang', avatar: '✨', city: 'Zaragoza', stars: 28, wordsFound: 24, levelsCompleted: 8, proverbsSolved: 8, timeAttackHighScore: 440, title: 'Culturista del Léxico' },
      { name: 'Leandro Edú', avatar: '🛡️', city: 'Añisok', stars: 27, wordsFound: 23, levelsCompleted: 8, proverbsSolved: 7, timeAttackHighScore: 430, title: 'Guardián del Mvet' },
      { name: 'Rosalía Avomo', avatar: '🌟', city: 'Douala', stars: 26, wordsFound: 22, levelsCompleted: 7, proverbsSolved: 7, timeAttackHighScore: 410, title: 'Poetisa de Kie-Ntem' },
      { name: 'Bonifacio Obama', avatar: '🏆', city: 'Nsork', stars: 25, wordsFound: 21, levelsCompleted: 7, proverbsSolved: 6, timeAttackHighScore: 390, title: 'Campeón de Sopa de Letras' },
      { name: 'Clara Mecheba', avatar: '🍃', city: 'Malabo', stars: 24, wordsFound: 20, levelsCompleted: 7, proverbsSolved: 6, timeAttackHighScore: 380, title: 'Descubridora de Topónimos' },
      { name: 'Marcos Ela', avatar: '🔥', city: 'Bata', stars: 23, wordsFound: 19, levelsCompleted: 6, proverbsSolved: 5, timeAttackHighScore: 360, title: 'Palabrero Ágil' },
      { name: 'Beatriz Mitogo', avatar: '🌺', city: 'Londres', stars: 22, wordsFound: 18, levelsCompleted: 6, proverbsSolved: 5, timeAttackHighScore: 350, title: 'Coleccionista de Pistas' },
      { name: 'Secundino Ntutumu', avatar: '🌾', city: 'Mikomeseng', stars: 21, wordsFound: 18, levelsCompleted: 6, proverbsSolved: 4, timeAttackHighScore: 330, title: 'Erudito del Cacao' },
      { name: 'Dolores Eyenga', avatar: '🌴', city: 'Sevilla', stars: 20, wordsFound: 17, levelsCompleted: 5, proverbsSolved: 4, timeAttackHighScore: 320, title: 'Raíces Guineanas' },
      { name: 'Plácido Miko', avatar: '☀️', city: 'Malabo', stars: 19, wordsFound: 16, levelsCompleted: 5, proverbsSolved: 3, timeAttackHighScore: 300, title: 'Analista de Leyendas' },
      { name: 'Esther Asue', avatar: '🦋', city: 'Cogo', stars: 19, wordsFound: 16, levelsCompleted: 5, proverbsSolved: 3, timeAttackHighScore: 290, title: 'Descifradora de Modismos' },
      { name: 'Genaro Ndong', avatar: '🏹', city: 'Bata', stars: 18, wordsFound: 15, levelsCompleted: 5, proverbsSolved: 3, timeAttackHighScore: 280, title: 'Cazador de Vocablos' },
      { name: 'Concepción Bilogo', avatar: '🌼', city: 'París', stars: 17, wordsFound: 14, levelsCompleted: 4, proverbsSolved: 2, timeAttackHighScore: 270, title: 'Amante de la AEGLE' },
      { name: 'Faustino Nguema', avatar: '🌍', city: 'Mbini', stars: 16, wordsFound: 14, levelsCompleted: 4, proverbsSolved: 2, timeAttackHighScore: 250, title: 'Geógrafo del Benito' },
      { name: 'Milagrosa Okomo', avatar: '💐', city: 'Malabo', stars: 16, wordsFound: 13, levelsCompleted: 4, proverbsSolved: 2, timeAttackHighScore: 240, title: 'Entusiasta Cultural' },
      { name: 'Eulogio Abeso', avatar: '⚓', city: 'Kogo', stars: 15, wordsFound: 13, levelsCompleted: 4, proverbsSolved: 2, timeAttackHighScore: 230, title: 'Patrón del Estuario' },
      { name: 'Verónica Angue', avatar: '🌙', city: 'Bilbao', stars: 14, wordsFound: 12, levelsCompleted: 3, proverbsSolved: 1, timeAttackHighScore: 220, title: 'Buscadora Nocturna' },
      { name: 'Felipe Ondo', avatar: '🌲', city: 'Acurenam', stars: 14, wordsFound: 12, levelsCompleted: 3, proverbsSolved: 1, timeAttackHighScore: 210, title: 'Botánico de Monte Alén' },
      { name: 'Gisela Mokata', avatar: '🌻', city: 'Malabo', stars: 13, wordsFound: 11, levelsCompleted: 3, proverbsSolved: 1, timeAttackHighScore: 200, title: 'Lectora de Bioko' },
      { name: 'Santiago Bee', avatar: '⛵', city: 'Bata', stars: 12, wordsFound: 10, levelsCompleted: 3, proverbsSolved: 1, timeAttackHighScore: 190, title: 'Marinero de Utonde' },
      { name: 'Lidia Mbasogo', avatar: '🕊️', city: 'Washington D.C.', stars: 12, wordsFound: 10, levelsCompleted: 3, proverbsSolved: 1, timeAttackHighScore: 180, title: 'Voz Transatlántica' },
      { name: 'Armando Nguema', avatar: '🧭', city: 'Niefang', stars: 11, wordsFound: 9, levelsCompleted: 2, proverbsSolved: 1, timeAttackHighScore: 170, title: 'Pionero de Niefang' },
      { name: 'Purificación Moto', avatar: '🌺', city: 'Malabo', stars: 10, wordsFound: 9, levelsCompleted: 2, proverbsSolved: 1, timeAttackHighScore: 160, title: 'Exploradora de Rebolla' },
      { name: 'Lucas Obama', avatar: '⚡', city: 'Ebebiyín', stars: 10, wordsFound: 8, levelsCompleted: 2, proverbsSolved: 1, timeAttackHighScore: 150, title: 'Relámpago de la Frontera' },
      { name: 'Sonsoles Nfumu', avatar: '🌴', city: 'Madrid', stars: 9, wordsFound: 8, levelsCompleted: 2, proverbsSolved: 0, timeAttackHighScore: 140, title: 'Palavera Viva' },
      { name: 'Emilio Sima', avatar: '🛶', city: 'Luba', stars: 9, wordsFound: 7, levelsCompleted: 2, proverbsSolved: 0, timeAttackHighScore: 130, title: 'Guía de Ureca' },
      { name: 'Victoria Eyang', avatar: '⭐', city: 'Bata', stars: 8, wordsFound: 7, levelsCompleted: 1, proverbsSolved: 0, timeAttackHighScore: 120, title: 'Nueva Estrella Cultural' },
      { name: 'Celestino Ekua', avatar: '🛡️', city: 'Mongomo', stars: 8, wordsFound: 6, levelsCompleted: 1, proverbsSolved: 0, timeAttackHighScore: 110, title: 'Custodio de Tradiciones' },
      { name: 'Antonia Besari', avatar: '👑', city: 'Malabo', stars: 7, wordsFound: 6, levelsCompleted: 1, proverbsSolved: 0, timeAttackHighScore: 100, title: 'Dama de Ela Nguema' },
      { name: 'Prisciliano Ndong', avatar: '🌾', city: 'Evinayong', stars: 6, wordsFound: 5, levelsCompleted: 1, proverbsSolved: 0, timeAttackHighScore: 90, title: 'Sabio de Centro Sur' },
      { name: 'Mercedes Nchama', avatar: '🌸', city: 'Alicante', stars: 6, wordsFound: 5, levelsCompleted: 1, proverbsSolved: 0, timeAttackHighScore: 85, title: 'Estudiante de Guinea' },
      { name: 'Hilario Mba', avatar: '🌳', city: 'Bata', stars: 5, wordsFound: 4, levelsCompleted: 1, proverbsSolved: 0, timeAttackHighScore: 80, title: 'Amigo de ApalabraGE' }
    ];

    const merged = (this.state.users || []).map(u => {
      const match = guineanRoster.find(r => r.name === u.name);
      return match ? { ...match, ...u } : u;
    });

    guineanRoster.forEach((player, i) => {
      if (!merged.some(u => u.name === player.name)) {
        merged.push({ id: `rank-${i + 1}`, ...player });
      }
    });

    const getProverbsCount = (u) => {
      if (!u) return 0;
      if (Array.isArray(u.proverbsSolved)) return u.proverbsSolved.length;
      if (typeof u.proverbsSolved === 'number') return u.proverbsSolved;
      return 0;
    };

    if (this.state.rankingGameFilter === 'apalabrage') {
      merged.sort((a, b) => 
        (b.levelsCompleted || 0) - (a.levelsCompleted || 0) || 
        (b.wordsFound || 0) - (a.wordsFound || 0) || 
        (b.stars || 0) - (a.stars || 0)
      );
    } else if (this.state.rankingGameFilter === 'hangman') {
      merged.sort((a, b) => 
        getProverbsCount(b) - getProverbsCount(a) || 
        (b.stars || 0) - (a.stars || 0)
      );
    } else {
      merged.sort((a, b) => 
        (b.stars || 0) - (a.stars || 0) || 
        (b.wordsFound || 0) - (a.wordsFound || 0) || 
        (b.levelsCompleted || 0) - (a.levelsCompleted || 0)
      );
    }

    return merged;
  }

  renderDashboardRanking() {
    const list = this.getEnrichedRankingUsers();
    if (this.dom.navCountRanking) {
      this.dom.navCountRanking.textContent = Math.min(50, list.length);
    }
    this.renderDashboardPodium(list);
    this.renderDashboardRankingTable(list);
  }

  renderDashboardPodium(list = null) {
    if (!this.dom.dashPodiumContainer) return;
    const rankingUsers = list || this.getEnrichedRankingUsers();
    this.dom.dashPodiumContainer.innerHTML = '';

    const getProverbsCount = (u) => {
      if (!u) return 0;
      if (Array.isArray(u.proverbsSolved)) return u.proverbsSolved.length;
      if (typeof u.proverbsSolved === 'number') return u.proverbsSolved;
      return 0;
    };

    const getScoreBadge = (user) => {
      if (!user) return '⭐ 0 pts';
      if (this.state.rankingGameFilter === 'apalabrage') {
        return `🏆 ${user.levelsCompleted || 0} niv (${user.wordsFound || 0} 🔤)`;
      } else if (this.state.rankingGameFilter === 'hangman') {
        const pc = getProverbsCount(user);
        return `🪢 ${pc} ${pc === 1 ? 'refrán' : 'refranes'}`;
      } else {
        return `⭐ ${user.stars || 0} pts`;
      }
    };

    const top1 = rankingUsers[0];
    const top2 = rankingUsers[1];
    const top3 = rankingUsers[2];

    const makePodiumStep = (user, place, cssClass, medalEmoji, crown = '') => {
      if (!user) return null;
      const avatarHtml = (user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http')))
        ? `<img src="${user.avatar}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`
        : (user.avatar || '👤');

      const step = document.createElement('div');
      step.className = `dash-podium-step ${cssClass}`;
      step.title = `Toca para ver el perfil de ${user.name}`;
      step.innerHTML = `
        <div class="dash-podium-avatar-wrap">
          ${crown}
          <div class="dash-podium-avatar">${avatarHtml}</div>
        </div>
        <div class="dash-podium-name">${user.name || 'Sabio'}</div>
        <div class="dash-podium-title">${user.title || 'Maestro de la Lengua'}</div>
        <div class="dash-podium-city">📍 ${user.city || 'Guinea Ecuatorial'}</div>
        <div class="dash-podium-score">${getScoreBadge(user)}</div>
        <div class="dash-podium-base">
          <span>${medalEmoji} #${place}</span>
        </div>
      `;
      step.addEventListener('click', () => this.openPlayerProfileModal(user, place));
      return step;
    };

    if (top2) {
      const step2 = makePodiumStep(top2, 2, 'silver', '🥈');
      if (step2) this.dom.dashPodiumContainer.appendChild(step2);
    }
    if (top1) {
      const step1 = makePodiumStep(top1, 1, 'gold', '🥇', '<span class="dash-podium-crown">👑</span>');
      if (step1) this.dom.dashPodiumContainer.appendChild(step1);
    }
    if (top3) {
      const step3 = makePodiumStep(top3, 3, 'bronze', '🥉');
      if (step3) this.dom.dashPodiumContainer.appendChild(step3);
    }

    // Renderizar Sabios Destacados (Puestos 4 al 12)
    if (this.dom.dashTopSabiosGrid) {
      this.dom.dashTopSabiosGrid.innerHTML = '';
      const featured = rankingUsers.slice(3, 12);
      featured.forEach((u, i) => {
        const rank = i + 4;
        const card = document.createElement('div');
        card.className = 'dash-sabio-card';
        card.title = `Toca para inspeccionar perfil de ${u.name}`;
        const avatarHtml = (u.avatar && (u.avatar.startsWith('data:') || u.avatar.startsWith('http')))
          ? `<img src="${u.avatar}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`
          : (u.avatar || '👤');

        card.innerHTML = `
          <div class="dash-sabio-rank">#${rank}</div>
          <div class="dash-sabio-avatar">${avatarHtml}</div>
          <div class="dash-sabio-info">
            <div class="dash-sabio-name">${u.name}</div>
            <div class="dash-sabio-title">${u.title || 'Explorador Cultural'}</div>
            <div class="dash-sabio-meta">
              <span class="dash-sabio-stars">${getScoreBadge(u)}</span>
              <span>•</span>
              <span class="dash-sabio-city">📍 ${u.city || 'GE'}</span>
            </div>
          </div>
        `;
        card.addEventListener('click', () => this.openPlayerProfileModal(u, rank));
        this.dom.dashTopSabiosGrid.appendChild(card);
      });
    }
  }

  renderDashboardRankingTable(list = null) {
    if (!this.dom.tbodyDashRanking) return;
    this.dom.tbodyDashRanking.innerHTML = '';
    const rankingUsers = list || this.getEnrichedRankingUsers();

    const getProverbsCount = (u) => {
      if (!u) return 0;
      if (Array.isArray(u.proverbsSolved)) return u.proverbsSolved.length;
      if (typeof u.proverbsSolved === 'number') return u.proverbsSolved;
      return 0;
    };

    const query = (this.state.rankingSearchQuery || '').toLowerCase();
    const filtered = rankingUsers.filter(u => {
      if (!query) return true;
      return (u.name && u.name.toLowerCase().includes(query)) ||
             (u.city && u.city.toLowerCase().includes(query)) ||
             (u.title && u.title.toLowerCase().includes(query));
    }).slice(0, 50);

    if (this.dom.dashRankingCountLabel) {
      this.dom.dashRankingCountLabel.textContent = `🏆 Top ${filtered.length} Sabios Clasificados`;
    }

    if (filtered.length === 0) {
      this.dom.tbodyDashRanking.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:30px; color:#94a3b8;">No se encontraron sabios que coincidan con la búsqueda.</td></tr>`;
      return;
    }

    filtered.forEach((u, idx) => {
      const realRank = rankingUsers.findIndex(r => r.name === u.name) + 1;
      const rankDisplay = realRank === 1 ? '<span class="rank-pos-medal gold">🥇 #1</span>'
        : realRank === 2 ? '<span class="rank-pos-medal silver">🥈 #2</span>'
        : realRank === 3 ? '<span class="rank-pos-medal bronze">🥉 #3</span>'
        : `<strong>#${realRank}</strong>`;

      const avatarHtml = (u.avatar && (u.avatar.startsWith('data:') || u.avatar.startsWith('http')))
        ? `<img src="${u.avatar}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;" />`
        : (u.avatar || '👤');

      const speedStr = u.timeAttackHighScore ? `${u.timeAttackHighScore} pts` : (u.fastestLevelTime ? `${u.fastestLevelTime}s` : '--');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center;">${rankDisplay}</td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:32px; height:32px; border-radius:50%; background:#1e293b; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;">${avatarHtml}</div>
            <strong style="color:#ffffff;">${u.name}</strong>
          </div>
        </td>
        <td><span style="display:inline-flex; align-items:center; gap:3px; background:rgba(16,185,129,0.18); color:#6ee7b7; border:1px solid rgba(16,185,129,0.35); padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600;">📍 ${u.city || 'Malabo'}</span></td>
        <td><span style="color:#38bdf8; font-size:0.8rem; font-weight:600;">${u.title || 'Sabio Cultural'}</span></td>
        <td><span style="color:#fbbf24; font-weight:800;">⭐ ${u.stars || 0}</span></td>
        <td>${u.levelsCompleted || 0}</td>
        <td>${u.wordsFound || 0}</td>
        <td><span style="color:#f97316; font-weight:700;">🪢 ${getProverbsCount(u)}</span></td>
        <td style="color:#c084fc; font-weight:700;">⚡ ${speedStr}</td>
        <td>🔥 ${u.streakDays || 1} días</td>
        <td style="text-align: center;">
          <button class="table-action-btn btn-view-pp" title="Ver Perfil Completo">👁️</button>
        </td>
      `;

      tr.querySelector('.btn-view-pp').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openPlayerProfileModal(u, realRank);
      });
      tr.addEventListener('click', () => {
        this.openPlayerProfileModal(u, realRank);
      });
      this.dom.tbodyDashRanking.appendChild(tr);
    });
  }

  openPlayerProfileModal(player, rank = 1) {
    if (!player || !this.dom.modalDashPlayerProfile) return;
    const getProverbsCount = (u) => {
      if (!u) return 0;
      if (Array.isArray(u.proverbsSolved)) return u.proverbsSolved.length;
      if (typeof u.proverbsSolved === 'number') return u.proverbsSolved;
      return 0;
    };

    if (this.dom.dashPpName) this.dom.dashPpName.textContent = player.name || 'Sabio Cultural';
    if (this.dom.dashPpAvatar) {
      if (player.avatar && (player.avatar.startsWith('data:') || player.avatar.startsWith('http'))) {
        this.dom.dashPpAvatar.innerHTML = `<img src="${player.avatar}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`;
      } else {
        this.dom.dashPpAvatar.textContent = player.avatar || '👤';
      }
    }
    if (this.dom.dashPpTitle) this.dom.dashPpTitle.textContent = player.title || 'Explorador Cultural de Guinea Ecuatorial';
    if (this.dom.dashPpCity) this.dom.dashPpCity.textContent = `📍 ${player.city || 'Malabo'}`;
    if (this.dom.dashPpRank) this.dom.dashPpRank.textContent = `Posición #${rank}`;
    if (this.dom.dashPpStars) this.dom.dashPpStars.textContent = `${player.stars || 0}`;
    if (this.dom.dashPpLevels) this.dom.dashPpLevels.textContent = `${player.levelsCompleted || 0}`;
    if (this.dom.dashPpWords) this.dom.dashPpWords.textContent = `${player.wordsFound || 0}`;
    if (this.dom.dashPpProverbs) this.dom.dashPpProverbs.textContent = `${getProverbsCount(player)}`;
    if (this.dom.dashPpSpeed) {
      this.dom.dashPpSpeed.textContent = player.timeAttackHighScore ? `${player.timeAttackHighScore} pts` : (player.fastestLevelTime ? `${player.fastestLevelTime}s` : '1200 pts');
    }

    this.dom.modalDashPlayerProfile.classList.add('active');
  }

  /* ================= GESTIÓN DE MODALES ================= */

  calculateNextLevelTitle(currentTitle) {
    if (!currentTitle) return 'Nuevo Nivel';
    const trimmed = currentTitle.trim();

    const romanValues = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
      'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15,
      'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19, 'XX': 20,
      'XXI': 21, 'XXII': 22, 'XXIII': 23, 'XXIV': 24, 'XXV': 25
    };

    const toRoman = (num) => {
      const lookup = [
        ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
        ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
        ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
      ];
      let roman = '';
      for (const [letter, value] of lookup) {
        while (num >= value) {
          roman += letter;
          num -= value;
        }
      }
      return roman || 'I';
    };

    const romanRegex = /\s+(XXV|XXIV|XXIII|XXII|XXI|XX|XIX|XVIII|XVII|XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)$/i;
    const arabicRegex = /\s+(\d+)$/;

    let baseName = trimmed;
    let currentNum = 1;
    let format = 'roman';

    const romanMatch = trimmed.match(romanRegex);
    if (romanMatch) {
      currentNum = romanValues[romanMatch[1].toUpperCase()] || 1;
      baseName = trimmed.replace(romanRegex, '').trim();
      format = 'roman';
    } else {
      const arabicMatch = trimmed.match(arabicRegex);
      if (arabicMatch) {
        currentNum = parseInt(arabicMatch[1], 10) || 1;
        baseName = trimmed.replace(arabicRegex, '').trim();
        format = 'arabic';
      } else {
        baseName = trimmed;
        currentNum = 1;
        format = 'roman';
      }
    }

    // Comprobar todos los niveles existentes en estado con este mismo título base para evitar colisiones
    const existingNums = [currentNum];
    const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    (this.state.levels || []).forEach(l => {
      const t = (l.title || '').trim();
      if (format === 'roman') {
        const m = t.match(new RegExp(`^${escapedBase}(?:\\s+(XXV|XXIV|XXIII|XXII|XXI|XX|XIX|XVIII|XVII|XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I))?$`, 'i'));
        if (m) {
          if (!m[1]) {
            existingNums.push(1);
          } else {
            const val = romanValues[m[1].toUpperCase()];
            if (val) existingNums.push(val);
          }
        }
      } else {
        const m = t.match(new RegExp(`^${escapedBase}(?:\\s+(\\d+))?$`, 'i'));
        if (m) {
          if (!m[1]) {
            existingNums.push(1);
          } else {
            existingNums.push(parseInt(m[1], 10));
          }
        }
      }
    });

    const maxNum = Math.max(...existingNums);
    const nextNum = Math.max(currentNum + 1, maxNum + 1);

    if (format === 'roman') {
      return `${baseName} ${toRoman(nextNum)}`;
    } else {
      return `${baseName} ${nextNum}`;
    }
  }

  openCreateNextLevelModal(sourceLevel) {
    if (!sourceLevel) return;

    this.updateCategorySelectOptions();
    this.dom.wordsInputsContainer.innerHTML = '';

    const nextTitle = this.calculateNextLevelTitle(sourceLevel.title);

    document.getElementById('modal-level-title').textContent = `Nuevo Nivel Derivado: ${nextTitle}`;
    this.dom.inputLevelId.value = '';
    this.dom.inputLevelName.value = nextTitle;

    let catId = sourceLevel.categoryId;
    if (catId === 'etnias_identidad' || catId === 'modismos') catId = 'sociedad';
    this.dom.selectLevelCategory.value = catId;
    this.dom.inputLevelClue.value = sourceLevel.clue || '';

    // 3 filas vacías preparadas para las nuevas palabras
    this.addWordInputRow('', '');
    this.addWordInputRow('', '');
    this.addWordInputRow('', '');

    this.dom.modalLevel.classList.add('active');

    // Foco automático en el primer campo de palabra
    setTimeout(() => {
      const firstWordInput = this.dom.wordsInputsContainer.querySelector('.input-word-val');
      if (firstWordInput) firstWordInput.focus();
    }, 120);
  }

  openLevelModal(levelId = null) {
    this.updateCategorySelectOptions();
    this.dom.wordsInputsContainer.innerHTML = '';

    if (levelId) {
      const lvl = this.state.levels.find(l => String(l.id) === String(levelId));
      if (!lvl) return;
      document.getElementById('modal-level-title').textContent = `Editar Nivel #${lvl.id}`;
      this.dom.inputLevelId.value = lvl.id;
      this.dom.inputLevelName.value = lvl.title;
      let catId = lvl.categoryId;
      if (catId === 'etnias_identidad' || catId === 'modismos') catId = 'sociedad';
      this.dom.selectLevelCategory.value = catId;
      this.dom.inputLevelClue.value = lvl.clue;

      (lvl.words || []).forEach(w => {
        const wordText = typeof w === 'string' ? w : w.word;
        const clueText = typeof w === 'string' ? '' : (w.clue || '');
        this.addWordInputRow(wordText, clueText);
      });
    } else {
      document.getElementById('modal-level-title').textContent = 'Añadir Nuevo Nivel Cultural';
      this.dom.inputLevelId.value = '';
      this.dom.inputLevelName.value = '';
      this.dom.selectLevelCategory.value = 'gastronomia';
      this.dom.inputLevelClue.value = '';

      // 3 filas vacías por defecto
      this.addWordInputRow('', '');
      this.addWordInputRow('', '');
      this.addWordInputRow('', '');
    }

    this.dom.modalLevel.classList.add('active');
  }

  addWordInputRow(word = '', clue = '') {
    const row = document.createElement('div');
    row.className = 'word-row-input';
    row.innerHTML = `
      <input type="text" class="input-word-val" placeholder="PALABRA" value="${word}" required maxlength="12" style="text-transform: uppercase; font-weight:700;" />
      <input type="text" class="input-word-clue" placeholder="Significado cultural o pista (Glosario)" value="${clue}" />
      <button type="button" class="btn-remove-word-row" title="Eliminar fila">✕</button>
    `;

    row.querySelector('.btn-remove-word-row').addEventListener('click', () => {
      if (this.dom.wordsInputsContainer.children.length > 2) {
        row.remove();
      } else {
        alert('Un nivel debe tener al menos 2 palabras.');
      }
    });

    this.dom.wordsInputsContainer.appendChild(row);
  }

  async handleSaveLevel() {
    const idVal = this.dom.inputLevelId.value || String(Date.now());
    const title = this.dom.inputLevelName.value.trim();
    const categoryId = this.dom.selectLevelCategory.value;
    const clue = this.dom.inputLevelClue.value.trim();

    // Categoría meta
    const catObj = this.state.categories.find(c => c.id === categoryId) || {};

    // Recoger palabras
    const rows = this.dom.wordsInputsContainer.querySelectorAll('.word-row-input');
    const words = [];
    rows.forEach(r => {
      const w = r.querySelector('.input-word-val').value.trim().toUpperCase();
      const c = r.querySelector('.input-word-clue').value.trim();
      if (w) {
        words.push({ word: w, clue: c || `Término cultural de Guinea Ecuatorial.` });
      }
    });

    if (words.length < 2) {
      alert('Introduce al menos 2 palabras para este nivel.');
      return;
    }

    const existingIdx = this.state.levels.findIndex(l => String(l.id) === String(idVal));
    const existingLvl = existingIdx >= 0 ? this.state.levels[existingIdx] : null;

    const levelData = {
      id: idVal,
      title,
      categoryId,
      categoryName: catObj.name || categoryId,
      categoryIcon: catObj.icon || '🇬🇶',
      clue,
      words,
      createdAt: existingLvl?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Guardar en Firestore
    try {
      await setDoc(doc(db, 'levels', String(idVal)), levelData);
      this.showToast(`✅ Nivel "${title}" guardado en Firestore.`);
    } catch(err) {
      console.warn('Error guardando en Firestore:', err);
      this.showToast(`⚠️ Guardado localmente (Firestore no disponible).`);
    }

    // Actualizar estado local
    if (existingIdx >= 0) {
      this.state.levels[existingIdx] = levelData;
    } else {
      this.state.levels.push(levelData);
    }
    this.saveLocalBackup();

    this.closeModal(this.dom.modalLevel);
    this.updateKPIs();
    this.renderLevelsTable();
    this.renderOverview();
  }

  async confirmDeleteLevel(id, title) {
    if (confirm(`¿Seguro que deseas eliminar el nivel "${title}"?`)) {
      try {
        await deleteDoc(doc(db, 'levels', String(id)));
        this.showToast(`🗑️ Nivel "${title}" eliminado de Firestore.`);
      } catch (err) {
        console.warn('Error borrando de Firestore:', err);
      }

      this.state.levels = this.state.levels.filter(l => String(l.id) !== String(id));
      this.saveLocalBackup();
      this.updateKPIs();
      this.renderLevelsTable();
      this.renderOverview();
    }
  }

  /* ================= MODAL CURIOSIDADES ================= */

  openTriviaModal(triviaId = null) {
    if (triviaId) {
      const t = this.state.trivias.find(item => item.id === triviaId);
      if (!t) return;
      this.dom.inputTriviaId.value = t.id;
      this.dom.inputTriviaText.value = t.text;
      this.dom.selectTriviaTopic.value = t.topic || 'Geografía';
      document.getElementById('modal-trivia-title').textContent = 'Editar Curiosidad';
    } else {
      this.dom.inputTriviaId.value = '';
      this.dom.inputTriviaText.value = '';
      this.dom.selectTriviaTopic.value = 'Geografía';
      document.getElementById('modal-trivia-title').textContent = 'Nueva Curiosidad Cultural';
    }

    this.dom.modalTrivia.classList.add('active');
  }

  async handleSaveTrivia() {
    const idVal = this.dom.inputTriviaId.value || `trivia-${Date.now()}`;
    const text = this.dom.inputTriviaText.value.trim();
    const topic = this.dom.selectTriviaTopic.value;

    const triviaData = { id: idVal, text, topic, updatedAt: new Date().toISOString() };

    try {
      await setDoc(doc(db, 'trivias', idVal), triviaData);
      this.showToast('✅ Curiosidad guardada en Firestore.');
    } catch(err) {
      console.warn('Error guardando trivia:', err);
    }

    const idx = this.state.trivias.findIndex(t => t.id === idVal);
    if (idx >= 0) {
      this.state.trivias[idx] = triviaData;
    } else {
      this.state.trivias.push(triviaData);
    }

    this.closeModal(this.dom.modalTrivia);
    this.updateKPIs();
    this.renderTrivias();
  }

  async confirmDeleteTrivia(id) {
    if (confirm('¿Eliminar esta curiosidad cultural?')) {
      try {
        await deleteDoc(doc(db, 'trivias', id));
        this.showToast('🗑️ Curiosidad eliminada.');
      } catch (err) {
        console.warn('Error eliminando trivia:', err);
      }
      this.state.trivias = this.state.trivias.filter(t => t.id !== id);
      this.updateKPIs();
      this.renderTrivias();
    }
  }

  /* ================= MODAL TROFEOS ================= */

  openTrophyModal(trophyId = null) {
    if (trophyId) {
      const tr = this.state.trophies.find(item => item.id === trophyId);
      if (!tr) return;
      this.dom.inputTrophyId.value = tr.id;
      this.dom.inputTrophyIcon.value = tr.icon || '🏆';
      this.dom.inputTrophyTitleText.value = tr.title || '';
      this.dom.inputTrophyDesc.value = tr.desc || '';
      this.dom.selectTrophyCriterion.value = tr.criterion || 'first_word';
      this.dom.inputTrophyTarget.value = tr.target || 1;
      document.getElementById('modal-trophy-title').textContent = 'Editar Trofeo Cultural';
    } else {
      this.dom.inputTrophyId.value = '';
      this.dom.inputTrophyIcon.value = '🏆';
      this.dom.inputTrophyTitleText.value = '';
      this.dom.inputTrophyDesc.value = '';
      this.dom.selectTrophyCriterion.value = 'first_word';
      this.dom.inputTrophyTarget.value = '2';
      document.getElementById('modal-trophy-title').textContent = '➕ Nuevo Trofeo Cultural';
    }

    this.dom.modalTrophy.classList.add('active');
  }

  async handleSaveTrophy() {
    const idVal = this.dom.inputTrophyId.value || `trophy-${Date.now()}`;
    const icon = this.dom.inputTrophyIcon.value.trim() || '🏆';
    const title = this.dom.inputTrophyTitleText.value.trim();
    const desc = this.dom.inputTrophyDesc.value.trim();
    const criterion = this.dom.selectTrophyCriterion.value;
    const target = parseInt(this.dom.inputTrophyTarget.value, 10) || 1;

    const trophyData = {
      id: idVal,
      icon,
      title,
      desc,
      criterion,
      target,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'achievements', idVal), trophyData);
      this.showToast(`✅ Trofeo "${title}" guardado en Firestore.`);
    } catch (err) {
      console.warn('Error guardando trofeo en Firestore:', err);
      this.showToast(`💾 Trofeo guardado localmente.`);
    }

    const idx = this.state.trophies.findIndex(t => t.id === idVal);
    if (idx >= 0) {
      this.state.trophies[idx] = trophyData;
    } else {
      this.state.trophies.push(trophyData);
    }

    this.closeModal(this.dom.modalTrophy);
    this.updateKPIs();
    this.renderTrophies();
  }

  async confirmDeleteTrophy(id) {
    if (confirm('¿Eliminar este trofeo de la lista oficial?')) {
      try {
        await deleteDoc(doc(db, 'achievements', id));
        this.showToast('🗑️ Trofeo eliminado de Firestore.');
      } catch (err) {
        console.warn('Error eliminando trofeo:', err);
      }
      this.state.trophies = this.state.trophies.filter(t => t.id !== id);
      this.updateKPIs();
      this.renderTrophies();
    }
  }

  closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('active');
  }

  /* ================= BACKUP Y SEMBRADO ================= */

  exportBackupJson() {
    const backupData = {
      exportedAt: new Date().toISOString(),
      appName: "ApalabraGE",
      version: "1.0.0",
      levels: this.state.levels,
      categories: this.state.categories,
      trophies: this.state.trophies,
      ranks: this.state.ranks,
      trivias: this.state.trivias,
      usersCount: this.state.users.length
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `apalabrage_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    this.showToast('📥 Copia de seguridad JSON descargada.');
  }

  async seedFirestoreWithDefaults() {
    if (!confirm('¿Deseas sincronizar todos los 11 niveles culturales oficiales, categorías, trofeos y rangos en Cloud Firestore?')) {
      return;
    }

    this.showToast('⏳ Sembrando datos en Firestore...');

    try {
      // 1. Subir categorías
      for (const cat of (defaultLevelsData.categories || [])) {
        const { levels, ...catData } = cat;
        await setDoc(doc(db, 'categories', cat.id), catData);
      }

      // 2. Subir niveles
      const allLevels = this.extractDefaultLevels();
      for (const lvl of allLevels) {
        await setDoc(doc(db, 'levels', String(lvl.id)), {
          ...lvl,
          updatedAt: new Date().toISOString()
        });
      }

      // 3. Subir curiosidades
      for (const t of this.state.trivias) {
        await setDoc(doc(db, 'trivias', t.id), t);
      }

      // 4. Subir trofeos oficiales
      for (const tr of this.state.trophies) {
        await setDoc(doc(db, 'achievements', tr.id), tr);
      }

      // 5. Subir rangos culturales
      for (const rk of this.state.ranks) {
        await setDoc(doc(db, 'ranks', rk.id), rk);
      }

      this.showToast('🎉 ¡Banco cultural y trofeos sincronizados al 100% en Firestore!');
      await this.loadAllData();
    } catch (err) {
      console.error('Error al sembrar Firestore:', err);
      alert('Hubo un problema sembrando los datos en Firestore: ' + err.message);
    }
  }

  /* ================= IMPORTADOR MASIVO LIBRO GE ================= */

  renderImporter() {
    if (!this.dom.importerTopicsGrid) return;
    this.dom.importerTopicsGrid.innerHTML = '';

    const query = this.state.importerSearchQuery || '';
    const catFilter = this.state.importerCategoryFilter || 'all';

    // Contar cuántos están ya importados como niveles
    let importedCount = 0;
    const existingTitles = new Set(this.state.levels.map(l => (l.title || '').toLowerCase().trim()));

    const filteredTopics = (this.state.bookTopics || []).filter(topic => {
      const matchCat = catFilter === 'all' || topic.categoryId === catFilter;
      const matchQuery = !query || 
        topic.title.toLowerCase().includes(query) ||
        (topic.words || []).some(w => w.toLowerCase().includes(query)) ||
        (topic.playableWords || []).some(pw => pw.word.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });

    // Actualizar contadores globales
    this.state.bookTopics.forEach(topic => {
      const isImported = existingTitles.has(topic.cleanTitle.toLowerCase()) || 
        this.state.levels.some(l => l.id === `lvl-${topic.id}`);
      if (isImported) importedCount++;
    });

    if (this.dom.importerCountImported) this.dom.importerCountImported.textContent = importedCount;
    if (this.dom.importerCountPending) this.dom.importerCountPending.textContent = Math.max(0, this.state.bookTopics.length - importedCount);
    if (this.dom.navCountImporter) this.dom.navCountImporter.textContent = Math.max(0, this.state.bookTopics.length - importedCount);

    if (filteredTopics.length === 0) {
      this.dom.importerTopicsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">
          No se encontraron temas que coincidan con la búsqueda.
        </div>
      `;
      return;
    }

    filteredTopics.forEach(topic => {
      const isImported = existingTitles.has(topic.cleanTitle.toLowerCase()) || 
        this.state.levels.some(l => l.id === `lvl-${topic.id}`);

      const card = document.createElement('div');
      card.className = `importer-topic-card ${isImported ? 'imported' : ''}`;

      const wordsPills = (topic.playableWords || []).slice(0, 6).map(pw => 
        `<span class="importer-word-pill">${pw.word}</span>`
      ).join(' ');

      card.innerHTML = `
        <div>
          <div class="importer-card-top">
            <div class="importer-card-title-wrap">
              <span class="importer-num-badge">#${topic.number || topic.id}</span>
              <h4 class="importer-card-title">${topic.cleanTitle}</h4>
            </div>
            <span class="cat-tag cat-${topic.categoryId}">${topic.categoryIcon || '🇬🇶'} ${topic.categoryName}</span>
          </div>
          <div class="importer-clue-preview">"${topic.clue}"</div>
          <div class="importer-words-chips">
            ${wordsPills}
            ${(topic.playableWords || []).length > 6 ? `<span class="importer-word-pill" style="opacity:0.6;">+${topic.playableWords.length - 6} más</span>` : ''}
          </div>
        </div>
        <div class="importer-card-footer">
          <span style="font-size: 0.78rem; color: #64748b;">
            ${(topic.words || []).length} términos en libro
          </span>
          <button class="btn-import-topic ${isImported ? 'imported' : ''}" data-topic-id="${topic.id}">
            ${isImported ? '✓ Nivel Creado' : '⚡ Importar como Nivel'}
          </button>
        </div>
      `;

      const btn = card.querySelector('.btn-import-topic');
      if (!isImported) {
        btn.addEventListener('click', () => this.importTopicAsLevel(topic));
      }

      this.dom.importerTopicsGrid.appendChild(card);
    });
  }

  async importTopicAsLevel(topic) {
    const levelId = `lvl-${topic.id}`;
    if (this.state.levels.some(l => l.id === levelId)) {
      this.showToast(`El tema "${topic.cleanTitle}" ya está importado.`);
      return;
    }

    const words = (topic.playableWords && topic.playableWords.length >= 2)
      ? topic.playableWords
      : (topic.words || []).slice(0, 5).map(w => ({
          word: w.split(' ')[0].toUpperCase().replace(/[^A-ZÑ]/g, ''),
          clue: `Término del tema ${topic.cleanTitle}`
        })).filter(w => w.word.length >= 3);

    const newLevel = {
      id: levelId,
      title: topic.cleanTitle,
      categoryId: topic.categoryId,
      categoryName: topic.categoryName,
      categoryIcon: topic.categoryIcon,
      clue: topic.clue || `Descubre los términos de ${topic.cleanTitle}`,
      gridSize: { cols: 4, rows: 6 },
      words: words,
      source: 'Primera Edicion-Dic2023.pdf',
      updatedAt: new Date().toISOString()
    };

    this.state.levels.push(newLevel);
    this.saveLocalBackup();

    try {
      await setDoc(doc(db, 'levels', String(levelId)), newLevel);
    } catch (err) {
      console.warn('Error guardando nivel importado en Firestore:', err);
    }

    this.showToast(`🎉 ¡"${topic.cleanTitle}" importado como nivel cultural!`);
    this.updateKPIs();
    this.renderLevelsTable();
    this.renderOverview();
    this.renderImporter();
  }

  async importAllTopics() {
    const existingTitles = new Set(this.state.levels.map(l => (l.title || '').toLowerCase().trim()));
    const pendingTopics = (this.state.bookTopics || []).filter(t => 
      !existingTitles.has(t.cleanTitle.toLowerCase()) && 
      !this.state.levels.some(l => l.id === `lvl-${t.id}`)
    );

    if (pendingTopics.length === 0) {
      alert('¡Todos los 45 temas del libro ya han sido importados como niveles!');
      return;
    }

    if (!confirm(`¿Deseas importar los ${pendingTopics.length} temas pendientes del libro de pasatiempos de una sola vez?`)) {
      return;
    }

    this.showToast(`⏳ Importando ${pendingTopics.length} temas del libro...`);

    for (const topic of pendingTopics) {
      const levelId = `lvl-${topic.id}`;
      const words = (topic.playableWords && topic.playableWords.length >= 2)
        ? topic.playableWords
        : (topic.words || []).slice(0, 5).map(w => ({
            word: w.split(' ')[0].toUpperCase().replace(/[^A-ZÑ]/g, ''),
            clue: `Término del tema ${topic.cleanTitle}`
          })).filter(w => w.word.length >= 3);

      const newLevel = {
        id: levelId,
        title: topic.cleanTitle,
        categoryId: topic.categoryId,
        categoryName: topic.categoryName,
        categoryIcon: topic.categoryIcon,
        clue: topic.clue || `Descubre los términos de ${topic.cleanTitle}`,
        gridSize: { cols: 4, rows: 6 },
        words: words,
        source: 'Primera Edicion-Dic2023.pdf',
        updatedAt: new Date().toISOString()
      };

      this.state.levels.push(newLevel);

      try {
        await setDoc(doc(db, 'levels', String(levelId)), newLevel);
      } catch (e) {
        console.warn('Error guardando en Firestore:', e);
      }
    }

    this.saveLocalBackup();
    this.showToast(`🚀 ¡${pendingTopics.length} nuevos niveles importados con éxito!`);
    this.updateKPIs();
    this.renderLevelsTable();
    this.renderOverview();
    this.renderImporter();
  }

  /* ================= GESTIÓN DE PATROCINIO (AEGLE) ================= */

  async loadSponsorshipSettings() {
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
    } catch (e) {}

    try {
      const snap = await getDoc(doc(db, 'settings', 'sponsorship'));
      if (snap.exists()) {
        config = { ...config, ...snap.data() };
      }
    } catch (err) {
      console.warn('Error leyendo settings/sponsorship de Firestore:', err);
    }

    this.state.sponsorship = config;
    this.updateSponsorshipUI();
  }

  updateSponsorshipUI() {
    const s = this.state.sponsorship;
    if (this.dom.toggleSponsorshipActive) {
      this.dom.toggleSponsorshipActive.checked = !!s.enabled;
    }
    if (this.dom.sponsorshipToggleStatusText) {
      if (s.enabled) {
        this.dom.sponsorshipToggleStatusText.textContent = "ACTIVADO (ON)";
        this.dom.sponsorshipToggleStatusText.style.color = "#4ade80";
      } else {
        this.dom.sponsorshipToggleStatusText.textContent = "DESACTIVADO (OFF)";
        this.dom.sponsorshipToggleStatusText.style.color = "#ef4444";
      }
    }
    if (this.dom.navSponsorshipBadge) {
      if (s.enabled) {
        this.dom.navSponsorshipBadge.textContent = "ON";
        this.dom.navSponsorshipBadge.style.background = "rgba(34, 197, 94, 0.2)";
        this.dom.navSponsorshipBadge.style.color = "#4ade80";
      } else {
        this.dom.navSponsorshipBadge.textContent = "OFF";
        this.dom.navSponsorshipBadge.style.background = "rgba(239, 68, 68, 0.2)";
        this.dom.navSponsorshipBadge.style.color = "#f87171";
      }
    }
    if (this.dom.inputSponsorName) this.dom.inputSponsorName.value = s.sponsorName || '';
    if (this.dom.inputSponsorShort) this.dom.inputSponsorShort.value = s.sponsorShort || '';
    if (this.dom.inputSponsorWebsite) this.dom.inputSponsorWebsite.value = s.website || '';
    if (this.dom.inputSponsorLogo) this.dom.inputSponsorLogo.value = s.logoUrl || '';
    if (this.dom.previewSponsorLogo) this.dom.previewSponsorLogo.src = s.logoUrl || '/AEGLE.png';
  }

  async saveSponsorshipSettings(showToastMessage = true) {
    const isEnabled = this.dom.toggleSponsorshipActive ? this.dom.toggleSponsorshipActive.checked : this.state.sponsorship.enabled;
    const sponsorName = this.dom.inputSponsorName ? this.dom.inputSponsorName.value.trim() : this.state.sponsorship.sponsorName;
    const sponsorShort = this.dom.inputSponsorShort ? this.dom.inputSponsorShort.value.trim() : this.state.sponsorship.sponsorShort;
    const website = this.dom.inputSponsorWebsite ? this.dom.inputSponsorWebsite.value.trim() : this.state.sponsorship.website;
    const logoUrl = this.dom.inputSponsorLogo ? this.dom.inputSponsorLogo.value.trim() : this.state.sponsorship.logoUrl;

    const data = {
      enabled: isEnabled,
      sponsorName: sponsorName || "Academia Ecuatoguineana de la Lengua Española",
      sponsorShort: sponsorShort || "AEGLE",
      website: website || "https://www.aegle.gq/",
      logoUrl: logoUrl || "/AEGLE.png",
      updatedAt: new Date().toISOString()
    };

    this.state.sponsorship = data;
    this.updateSponsorshipUI();

    try {
      localStorage.setItem('apalabrage_sponsorship', JSON.stringify(data));
    } catch (e) {}

    try {
      await setDoc(doc(db, 'settings', 'sponsorship'), data, { merge: true });
      if (showToastMessage) {
        this.showToast(isEnabled ? '✅ Patrocinio AEGLE ACTIVADO y sincronizado' : '⚪ Patrocinio AEGLE DESACTIVADO (Modo original)');
      }
    } catch (err) {
      console.error('Error guardando settings/sponsorship en Firestore:', err);
      if (showToastMessage) {
        this.showToast('💾 Guardado localmente (sin conexión)');
      }
    }
  }

  saveLocalBackup() {
    try {
      localStorage.setItem('apalabrage_cached_levels', JSON.stringify(this.state.levels));
    } catch (e) {}
  }

  showToast(message) {
    if (!this.dom.toast) return;
    this.dom.toast.textContent = message;
    this.dom.toast.classList.add('active');
    setTimeout(() => {
      this.dom.toast.classList.remove('active');
    }, 3000);
  }
}

// Inicializar la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new DashboardApp();
  app.init();
});
