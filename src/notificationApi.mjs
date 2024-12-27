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
            onPingX: (pingCallback) => this.onPingX(pingCallback), // Add method to handle backend-triggered pings
            pingNoResponse: (data) => this.pingNoResponse(data),
            onPingInwards: (data) => this.onPingInwards(data),
            /*onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (_event, value) => {console.log("MyApiXXXX"); callback(value)}),*/
            onUpdateCounter: (data) => this.onUpdateCounter(data),
            onPingY: (callback) => ipcRenderer.on('pingY', (_event, value) => {console.log("MyApi"); callback(value)}),
            onUpdateUi: (data) => this.onUpdateUi(data)
        };
        contextBridge.exposeInMainWorld("myApi", api);
    }
    ping(data, pingCallback) {
        console.log("MyApi: Invoking 'ping' event on ipcRenderer with data: " + data);
        ipcRenderer.invoke('ping', data)
            .then((result) => pingCallback(result));
    }

    onPingX(pingCallback) {
        ipcRenderer.on('pingX', (event, message) => {
            console.log("MyApi: Received 'ping' event from backend with message: " + message);
            pingCallback(message);
        });
    }

    onUpdateCounter(callback){
        ipcRenderer.on('update-counter', (_event, value) => {
            console.log("MyApi update counter new version"); 
            callback(value);
        });
    }

    onUpdateUi(callback){
        ipcRenderer.on('updateUi', (_event, value) => {
            console.log("notificationApi.mjs: updateUi IPC event called."); 
            callback(value);
        });
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