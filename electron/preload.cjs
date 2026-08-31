const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printThermalReceipt: (options) => ipcRenderer.invoke('print-thermal-receipt', options),
  platform: process.platform,
  version: process.versions.electron,
});
