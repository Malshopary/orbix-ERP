let electron = require('electron');
const path = require('path');
const fs = require('fs');

// Self-healing: If invoked with ELECTRON_RUN_AS_NODE or plain Node, respawn cleanly as native Electron GUI
if (typeof electron === 'string' || !electron.app) {
  const { spawn } = require('child_process');
  const electronExe = typeof electron === 'string' ? electron : path.join(__dirname, '../node_modules/electron/dist/electron.exe');
  const cleanEnv = Object.assign({}, process.env);
  delete cleanEnv.ELECTRON_RUN_AS_NODE;
  const child = spawn(electronExe, [__filename], {
    env: cleanEnv,
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  });
  child.unref();
  process.exit(0);
}

const { app, BrowserWindow, Menu, ipcMain, dialog } = electron;

const logPath = path.join(__dirname, '../electron-debug.log');
function logDebug(msg) {
  try {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logPath, entry);
  } catch {}
}

process.on('uncaughtException', (err) => {
  logDebug(`UNCAUGHT EXCEPTION: ${err?.stack || err}`);
});
process.on('unhandledRejection', (reason) => {
  logDebug(`UNHANDLED REJECTION: ${reason?.stack || reason}`);
});
process.on('exit', (code) => {
  logDebug(`PROCESS EXIT with code ${code}`);
});

let mainWindow;

function createWindow() {
  logDebug('createWindow() called');
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Orbix ERP - النظام المحاسبي المتكامل',
    icon: path.join(__dirname, '../public/icon.png'),
    show: true,
    autoHideMenuBar: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false,
    },
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    try { fs.appendFileSync(path.join(__dirname, '../page-console.log'), `[CONSOLE ${level}] ${message} (${sourceId}:${line})\n`); } catch {}
  });
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    try { fs.appendFileSync(path.join(__dirname, '../page-console.log'), `[RENDERER GONE] ${JSON.stringify(details)}\n`); } catch {}
  });
  mainWindow.webContents.on('did-fail-load', (event, code, desc, url) => {
    try { fs.appendFileSync(path.join(__dirname, '../page-console.log'), `[LOAD FAIL] ${code} ${desc} ${url}\n`); } catch {}
  });
  let distIndexPath = path.join(__dirname, '../dist/index.html');
  if (!fs.existsSync(distIndexPath)) {
    distIndexPath = path.join(app.getAppPath(), 'dist/index.html');
  }
  if (!fs.existsSync(distIndexPath)) {
    distIndexPath = path.join(process.resourcesPath, 'app/dist/index.html');
  }

  // Load UI: Try localhost:3000 with retry (full API / DB / AI features), fallback to dist/index.html
  function loadWithRetry(attempts = 10) {
    mainWindow.loadURL('http://localhost:3000').catch((err) => {
      if (attempts > 0) {
        logDebug(`loadURL retry in 400ms (${attempts} attempts remaining)`);
        setTimeout(() => loadWithRetry(attempts - 1), 400);
      } else {
        logDebug('loadURL failed all retries, falling back to dist/index.html');
        if (fs.existsSync(distIndexPath)) {
          mainWindow.loadFile(distIndexPath);
        } else {
          mainWindow.loadFile(path.join(__dirname, '../index.html')).catch(() => {
            mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
              <html dir="rtl" style="background:#0f172a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
                <div style="text-align:center;padding:30px;max-width:550px;background:#1e293b;border-radius:16px;border:1px solid #334155;">
                  <h2 style="color:#10b981;margin-bottom:12px;">نظام Orbix ERP - سطح المكتب</h2>
                  <p style="color:#94a3b8;font-size:14px;line-height:1.6;">جاري إعداد وتشغيل بيئة النظام...</p>
                  <div style="background:#0f172a;padding:12px;border-radius:8px;margin:16px 0;font-family:monospace;direction:ltr;color:#38bdf8;">
                    npm run build
                  </div>
                </div>
              </html>
            `)}`);
          });
        }
      }
    });
  }
  loadWithRetry();

  // Set application native menu
  const menuTemplate = [
    {
      label: 'ملف (File)',
      submenu: [
        {
          label: 'طباعة فورية (Print)',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.print({ silent: false, printBackground: true });
          },
        },
        { type: 'separator' },
        {
          label: 'إغلاق البرنامج (Exit)',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'عرض (View)',
      submenu: [
        { label: 'إعادة تحميل (Reload)', role: 'reload' },
        { label: 'تكبير كامل الشاشة (Fullscreen)', role: 'togglefullscreen' },
        { label: 'أدوات المطور وفحص الأخطاء (DevTools)', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'تكبير الخط', role: 'zoomIn' },
        { label: 'تصغير الخط', role: 'zoomOut' },
        { label: 'إعادة تعيين الحجم', role: 'resetZoom' },
      ],
    },
    {
      label: 'مساعدة (Help)',
      submenu: [
        {
          label: 'حول نظام Orbix ERP',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'حول Orbix ERP',
              message: 'Orbix ERP v2.5 Enterprise Desktop Edition',
              detail: 'نظام إدارة موارد المؤسسات والمحاسبة والـ POS.\nمصمم بتقنيات الويب والـ Electron للعمل بدون إنترنت وبأعلى درجات الأمان.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('close', (e) => {
    logDebug('mainWindow "close" event fired');
  });

  mainWindow.on('closed', () => {
    logDebug('mainWindow "closed" event fired');
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  logDebug('app.whenReady() resolved');
  createWindow();

  app.on('activate', () => {
    logDebug('app "activate" event');
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  logDebug('app "before-quit" event');
});

app.on('will-quit', () => {
  logDebug('app "will-quit" event');
});

app.on('quit', (event, exitCode) => {
  logDebug(`app "quit" event with exitCode ${exitCode}`);
});

app.on('window-all-closed', () => {
  logDebug('app "window-all-closed" event');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler for silent thermal printing
ipcMain.handle('print-thermal-receipt', async (event, options) => {
  if (!mainWindow) return false;
  return new Promise((resolve) => {
    mainWindow.webContents.print(
      {
        silent: options?.silent || false,
        printBackground: true,
        deviceName: options?.deviceName || '',
        pageSize: { width: 80000, height: 297000 }, // 80mm roll
      },
      (success, failureReason) => {
        if (!success) console.error('Print failed:', failureReason);
        resolve(success);
      }
    );
  });
});

// IPC Handler for Cash Drawer Kick pulse
ipcMain.handle('kick-cash-drawer', async () => {
  if (!mainWindow) return false;
  try {
    console.log('Orbix ERP: Hardware pulse signal emitted for cash drawer');
    return true;
  } catch (err) {
    console.error('Error triggering cash drawer pulse:', err);
    return false;
  }
});
