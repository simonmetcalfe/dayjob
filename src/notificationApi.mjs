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
            ping: (data, pingCallback) => this.ping(data, pingCallback)
        };
        contextBridge.exposeInMainWorld("myApi", api);
    }

    onUpdateUi(callback){
        ipcRenderer.on('updateUi', (_event, value) => {
            console.log("notificationApi.mjs: updateUi IPC event called."); 
            callback(value);
        });
    }

    ping(data, pingCallback) {
        console.log("MyApi: Invoking 'ping' event on ipcRenderer with data: " + data);
        ipcRenderer.invoke('ping', data)
            .then((result) => pingCallback(result));
    }
}