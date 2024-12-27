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
            ping: (data, pingCallback) => this.ping(data, pingCallback),
            pingNoResponse: (data) => this.pingNoResponse(data),
            onPingInwards: (data) => this.onPingInwards(data),
            onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (_event, value) => callback(value))
        };
        contextBridge.exposeInMainWorld("myApi", api);
    }
    ping(data, pingCallback) {
        console.log("MyApi: Invoking 'ping' event on ipcRenderer with data: " + data);
        ipcRenderer.invoke('ping', data)
            .then((result) => pingCallback(result));
    }
    pingNoResponse(data) {
        console.log("MyApi: Invoking 'ping' NO RESPONSEEEE event on ipcRenderer with data: " + data);
        ipcRenderer.invoke('pingNoResponse', data);
    }
    onPingInwards(data) {
        console.log("MyApi: Invoking PING INWARDS event on ipcRenderer with data: " + data);
        ipcRenderer.on('pingInwards', data);
    }
}