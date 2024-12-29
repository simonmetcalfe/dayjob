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
            openExternal: (url) => shell.openExternal(url),
            buttonPress: (buttonId) => ipcRenderer.send('buttonPress', buttonId),
            getPref:(key, valueCallback) => ipcRenderer.invoke('getPref', key).then((result) => valueCallback(result)),
            setPref:(key, value) => ipcRenderer.invoke('setPref', key, value),
            setPlaylists:(playlists) => ipcRenderer.invoke('setPlaylists',playlists),
            logAndDisplayError:(error) => ipcRenderer.invoke('logAndDisplayError', error)
        };
        contextBridge.exposeInMainWorld("myApi", api);
    } 
}
