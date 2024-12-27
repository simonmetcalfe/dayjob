/**
 * -------------------------------------------------------------------------------------------------
 * API
 * 
 * 
 * -------------------------------------------------------------------------------------------------
 */


import { contextBridge, /*ipcRenderer*/ } from "electron";
export class MyApi {
    expose() {
        let api = {
            node: () => process.versions.node,
            chrome: () => process.versions.chrome,
            electron: () => process.versions.electron
        };
        contextBridge.exposeInMainWorld("myApi", api);
    }
}
