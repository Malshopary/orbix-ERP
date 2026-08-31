const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Orbix ERP - النظام المحاسبي المتكامل',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false,
    },
    autoHideMenuBar: false,
    backgroundColor: '#0f172a',
  });

  // Resolve path to index.html accurately whether packaged in app.asar or raw folder
  let distIndexPath = path.join(__dirname, '../dist/index.html');
  if (!fs.existsSync(distIndexPath)) {
    distIndexPath = path.join(app.getAppPath(), 'dist/index.html');
  }
  if (!fs.existsSync(distIndexPath)) {
    distIndexPath = path.join(process.resourcesPath, 'app/dist/index.html');
  }

  // If dist/index.html exists, load it directly
  if (fs.existsSync(distIndexPath) && process.env.ELECTRON_DEV !== 'true') {
    mainWindow.loadFile(distIndexPath);
  } else {
    // If running in active local development mode with live server
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      if (fs.existsSync(distIndexPath)) {
        mainWindow.loadFile(distIndexPath);
      } else {
        mainWindow.loadFile(path.join(__dirname, '../index.html')).catch(() => {
          mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
            <html dir="rtl" style="background:#0f172a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
              <div style="text-align:center;padding:30px;max-width:550px;background:#1e293b;border-radius:16px;border:1px solid #334155;">
                <h2 style="color:#10b981;margin-bottom:12px;">تنبيه: يلزم تجميع ملفات المشروع</h2>
                <p style="color:#94a3b8;font-size:14px;line-height:1.6;">لم يتم العثور على مجلد <code>dist</code> المبني.</p>
                <div style="background:#0f172a;padding:12px;border-radius:8px;margin:16px 0;font-family:monospace;direction:ltr;color:#38bdf8;">
                  npm run build
                </div>
                <p style="color:#64748b;font-size:12px;">قم بتشغيل الأمر أعلاه في موجه الأوامر (CMD) ثم أعد بناء ملف التثبيت.</p>
              </div>
            </html>
          `)}`);
        });
      }
    });
  }

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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
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
