const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    captureScreen: async () => ipcRenderer.invoke('get-sources'),
});
