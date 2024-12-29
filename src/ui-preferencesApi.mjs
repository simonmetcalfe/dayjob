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
            onUpdateUi: (data) => this.onUpdateUi(data),
            buttonPress: (buttonId) => this.buttonPress(buttonId),
            getPref:(key, valueCallback) => this.getPref(key, valueCallback),
            setPref:(key, value) => this.setPref(key, value),
            setPlaylists:(playlists) => this.setPlaylists(playlists),
            logAndDisplayError:(error) => this.logAndDisplayError(error),
        };
        contextBridge.exposeInMainWorld("myApi", api);
    }

    buttonPress(buttonId) {
        console.log("MyApi: Invoking 'buttonPress' event on ipcRenderer with buttonId: " + buttonId);
        ipcRenderer.send('buttonPress', buttonId);
    }

    getPref(key, valueCallback){
        console.log("MyApi: Invoking 'getPref' event on ipcRenderer with key: " + key);
        ipcRenderer.invoke('getPref', key)
            .then((result) => valueCallback(result));
    }

    setPref(key, value){
        console.log("MyApi: Invoking 'setPref' event on ipcRenderer with key '" + key + "' and value: '" + value);
        ipcRenderer.invoke('setPref', key, value);
    }

    setPlaylists(playlists){
        console.log("MyApi: Invoking 'setPlaylists' event on ipcRenderer.");
        ipcRenderer.invoke('setPlaylists',playlists);
    }

    logAndDisplayError(error){
        console.log("MyApi: Invoking 'logAndDisplayError' event on ipcRenderer with error '" + error);
        ipcRenderer.invoke('logAndDisplayError', error);
    }
    
}
