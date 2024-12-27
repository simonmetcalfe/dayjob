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
            getVersionInfo: (data, callback) => this.getVersionInfo(data, callback)
        };
        contextBridge.exposeInMainWorld("myApi", api);
    }

    getVersionInfo(data, callback) {
        console.log("aboutApi.mjs: Invoking 'getVersionInfo' event on ipcRenderer with data: " + data);
        ipcRenderer.invoke('getVersionInfo', data)
            .then((result) => callback(result));
    }
}


