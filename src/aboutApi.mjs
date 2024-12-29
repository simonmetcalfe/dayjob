/**
 * -------------------------------------------------------------------------------------------------
 * API
 * 
 * 
 * -------------------------------------------------------------------------------------------------
 */


import { contextBridge, shell, ipcRenderer } from "electron";
export class MyApi {
    expose() {
        let api = {
            node: () => process.versions.node,
            chrome: () => process.versions.chrome,
            electron: () => process.versions.electron,
            openExternal: (url) => shell.openExternal(url),
            getVersionInfo: (data, callback) => ipcRenderer.invoke('getVersionInfo', data).then((result) => callback(result))
        };
        contextBridge.exposeInMainWorld("myApi", api);
    }
}


