/**
 * -------------------------------------------------------------------------------------------------
 * API
 * 
 * 
 * -------------------------------------------------------------------------------------------------
 */


import { contextBridge, ipcRenderer } from "electron";
export class MyApi {
    expose() {
        let api = {
            onUpdateUi: (callback) => ipcRenderer.on('updateUi', (_event, value) => {callback(value);}),
            buttonPress: (data) => ipcRenderer.send('buttonPress', data)
        };
        contextBridge.exposeInMainWorld("myApi", api);
    }  
}