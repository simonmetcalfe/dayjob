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
            onUpdateUi: (data) => this.onUpdateUi(data),
            buttonPress: (data) => this.buttonPress(data)
        };
        contextBridge.exposeInMainWorld("myApi", api);
    }

    onUpdateUi(callback){
        ipcRenderer.on('updateUi', (_event, value) => {
            console.log("notificationApi.mjs: updateUi IPC event called."); 
            callback(value);
        });
    }

    buttonPress(data) {
        console.log("MyApi: Invoking 'buttonPress' event on ipcRenderer with data: " + data);
        ipcRenderer.send('buttonPress', data);
    }
}