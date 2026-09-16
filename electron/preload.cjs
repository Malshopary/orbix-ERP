const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printThermalReceipt: (options) => ipcRenderer.invoke('print-thermal-receipt', options),
  kickCashDrawer: () => ipcRenderer.invoke('kick-cash-drawer'),
  platform: process.platform,
  version: process.versions.electron,
});
