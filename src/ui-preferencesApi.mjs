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
            buttonPress: (data) => this.buttonPress(data),
            setPref:(key, value) => this.setPref(key, value)
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

    setPref(key, value){
        console.log("MyApi: Invoking 'setPref' event on ipcRenderer with key '" + key + "' and value '" + value + "'");
        ipcRenderer.invoke('setPref', key, value);
    }
}


/*
---------

await ipcRenderer.invoke('getPref','dayjob_playlists_v1').then((result) => {
    if(result != undefined){
        playlists = result;
        document.getElementById('fldPlaylistId1').value = playlists[1].playlistUri;
        document.getElementById('fldPlaylistName1').value = playlists[1].playlistName;
        document.getElementById('fldPlaylistId2').value = playlists[2].playlistUri;
        document.getElementById('fldPlaylistName2').value = playlists[2].playlistName;
        document.getElementById('fldPlaylistId3').value = playlists[3].playlistUri;
        document.getElementById('fldPlaylistName3').value = playlists[3].playlistName;
        document.getElementById('fldPlaylistId4').value = playlists[4].playlistUri;
        document.getElementById('fldPlaylistName4').value = playlists[4].playlistName;
        document.getElementById('fldPlaylistId5').value = playlists[5].playlistUri;
        document.getElementById('fldPlaylistName5').value = playlists[5].playlistName;
        document.getElementById('fldPlaylistId6').value = playlists[6].playlistUri;
        document.getElementById('fldPlaylistName6').value = playlists[6].playlistName;
        document.getElementById('fldPlaylistId7').value = playlists[7].playlistUri;
        document.getElementById('fldPlaylistName7').value = playlists[7].playlistName;
        document.getElementById('fldPlaylistId8').value = playlists[8].playlistUri;
        document.getElementById('fldPlaylistName8').value = playlists[8].playlistName;
        document.getElementById('fldPlaylistId9').value = playlists[9].playlistUri;
        document.getElementById('fldPlaylistName9').value = playlists[9].playlistName;
        document.getElementById('fldPlaylistId10').value = playlists[0].playlistUri;
        document.getElementById('fldPlaylistName10').value = playlists[0].playlistName;
    }
})



*/
