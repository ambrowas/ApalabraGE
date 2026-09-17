import electronPkg from 'electron';
const { app, BrowserWindow, shell, Menu } = electronPkg;
import path from 'path';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

let mainWindow = null;
let staticServer = null;
let serverPort = null;

// Servidor estático autónomo ultra-ligero para que la app funcione siempre sin depender de Vite
function startStaticServer() {
  return new Promise((resolve) => {
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.webp': 'image/webp',
      '.apk': 'application/vnd.android.package-archive'
    };

    staticServer = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || reqPath === '') reqPath = '/dashboard.html';

      // 1. Intentar buscar en dist/
      let filePath = path.join(distDir, reqPath);
      if (!fs.existsSync(filePath)) {
        // 2. Intentar buscar en root o public
        filePath = path.join(rootDir, reqPath);
        if (!fs.existsSync(filePath)) {
          filePath = path.join(rootDir, 'public', reqPath);
        }
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        // Fallback a dashboard.html para SPA
        const fallback = path.join(distDir, 'dashboard.html');
        if (fs.existsSync(fallback)) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          fs.createReadStream(fallback).pipe(res);
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });

    staticServer.listen(0, '127.0.0.1', () => {
      serverPort = staticServer.address().port;
      console.log(`[Electron] Servidor estático activo en puerto ${serverPort}`);
      resolve(serverPort);
    });
  });
}

// Comprueba si el servidor de desarrollo de Vite ya está corriendo en el puerto 3000
function checkViteDevServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/dashboard.html', (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.setTimeout(600, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function createWindow() {
  const iconPath = path.join(rootDir, 'build', 'AppIcon.icns');

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 890,
    minWidth: 1080,
    minHeight: 700,
    title: 'ApalabraGE Dashboard - Panel de Gestión Cultural y Firebase',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#0b1320',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Permite peticiones directas y CORS flexibles a Firestore
    }
  });

  const isViteRunning = await checkViteDevServer();
  let targetUrl = '';

  if (isViteRunning) {
    targetUrl = 'http://localhost:3000/dashboard.html';
    console.log('[Electron] Conectado a servidor de desarrollo Vite: ' + targetUrl);
  } else {
    const port = await startStaticServer();
    targetUrl = `http://127.0.0.1:${port}/dashboard.html`;
    console.log('[Electron] Cargando desde servidor estático autónomo: ' + targetUrl);
  }

  mainWindow.loadURL(targetUrl);

  // Abrir enlaces externos en el navegador por defecto
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupMenu();
}

function setupMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: 'ApalabraGE Dashboard',
      submenu: [
        { role: 'about', label: 'Acerca de ApalabraGE Dashboard' },
        { type: 'separator' },
        { role: 'hide', label: 'Ocultar Dashboard' },
        { role: 'hideOthers', label: 'Ocultar Otros' },
        { role: 'unhide', label: 'Mostrar Todo' },
        { type: 'separator' },
        { role: 'quit', label: 'Salir' }
      ]
    }] : []),
    {
      label: 'Edición',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar Todo' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar Datos' },
        { role: 'forceReload', label: 'Recargar Forzado' },
        { role: 'toggleDevTools', label: 'Herramientas de Desarrollador' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Tamaño Real' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla Completa' }
      ]
    },
    {
      label: 'Ventana',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'zoom', label: 'Maximizar' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front', label: 'Traer al Frente' }
        ] : [
          { role: 'close', label: 'Cerrar' }
        ])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (staticServer) {
    staticServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
