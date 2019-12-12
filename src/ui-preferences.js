///////////////////////////////////////////////////////////////////
//// Included modules
///////////////////////////////////////////////////////////////////

// 'use strict'

const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
var log = require('electron-log');

log.warn('ui-preferences.js:  The ui-preferences.js script has run...');

// Bootstrap
window.$ = window.jQuery = require('jquery')
window.Tether = require('tether')
window.Bootstrap = require('bootstrap')

///////////////////////////////////////////////////////////////////
//// Included modules
///////////////////////////////////////////////////////////////////

var playlists = {}; // Easier to read/write to playlust object here


///////////////////////////////////////////////////////////////////
//// Retrieve data on load
///////////////////////////////////////////////////////////////////

async () => {
    // This is required - unsure why
}

(async () => {
    try {
        await ipcRenderer.invoke('getPref','spotify-server_clientId').then((result) => {
            if(result != undefined){document.getElementById('fldClientId').value = result;}
        })
    
        await ipcRenderer.invoke('getPref','spotify-server_clientSecret').then((result) => {
            if(result != undefined){document.getElementById('fldClientSecret').value = result;}
        })

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

        await ipcRenderer.invoke('getPref','dayjob_always_skip_tracks').then((result) => {
            if(result != undefined){document.getElementById('always_skip_tracks').checked = result;}
        })

        await ipcRenderer.invoke('getPref','dayjob_always_move_tracks').then((result) => {
            if(result != undefined){document.getElementById('always_move_tracks').checked = result;}
        })

        /* NOT IMPLEMENTED YET
        await ipcRenderer.invoke('getPref','dayjob_launch_at_startup',).then((result) => {
            if(result != undefined){document.getElementById('launch_at_startup').checked = result;}
        })
        */
        
    } 
    catch (e) {
        // Deal with the fact the chain failed
        ipcRenderer.invoke('logAndDisplayError','error_reading_preferences');
    }
})();

///////////////////////////////////////////////////////////////////
//// Button event listeners
///////////////////////////////////////////////////////////////////

$("#btnOpenDashboard").on( "click", function(event){
    ipcRenderer.send('btnOpenDashboard');
});

$("#btnConnectToSpotify").on( "click", function(event){
    ipcRenderer.send('connect_api');
});

///////////////////////////////////////////////////////////////////
//// Field change detection (save to preferences)
///////////////////////////////////////////////////////////////////

$("#fldClientId").on( "input", function(event){
    ipcRenderer.invoke('setPref','spotify-server_clientId',this.value);
});

$("#fldClientSecret").on( "input", function(event){
    ipcRenderer.invoke('setPref','spotify-server_clientSecret',this.value);
});

// TODO - Upon EVERY character change in ANY playlist field, the ENTIRE playlists JSON object is written back to disk!  Needs much improvement!
//Playlist 1
$("#fldPlaylistId1").on( "input", function(event){
    playlists[1].playlistUri = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

$("#fldPlaylistName1").on( "input", function(event){
    playlists[1].playlistName = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

//Playlist 2
$("#fldPlaylistId2").on( "input", function(event){
    playlists[2].playlistUri = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

$("#fldPlaylistName2").on( "input", function(event){
    playlists[2].playlistName = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

//Playlist 3
$("#fldPlaylistId3").on( "input", function(event){
    playlists[3].playlistUri = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

$("#fldPlaylistName3").on( "input", function(event){
    playlists[3].playlistName = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

//Playlist 4
$("#fldPlaylistId4").on( "input", function(event){
    playlists[4].playlistUri = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

$("#fldPlaylistName4").on( "input", function(event){
    playlists[4].playlistName = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

//Playlist 5
$("#fldPlaylistId5").on( "input", function(event){
    playlists[5].playlistUri = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

$("#fldPlaylistName5").on( "input", function(event){
    playlists[5].playlistName = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

//Playlist 6
$("#fldPlaylistId6").on( "input", function(event){
    playlists[6].playlistUri = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

$("#fldPlaylistName6").on( "input", function(event){
    playlists[6].playlistName = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

//Playlist 7
$("#fldPlaylistId7").on( "input", function(event){
    playlists[7].playlistUri = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

$("#fldPlaylistName7").on( "input", function(event){
    playlists[7].playlistName = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

//Playlist 8
$("#fldPlaylistId8").on( "input", function(event){
    playlists[8].playlistUri = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

$("#fldPlaylistName8").on( "input", function(event){
    playlists[8].playlistName = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

//Playlist 9
$("#fldPlaylistId9").on( "input", function(event){
    playlists[9].playlistUri = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

$("#fldPlaylistName9").on( "input", function(event){
    playlists[9].playlistName = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

//Playlist 10
$("#fldPlaylistId10").on( "input", function(event){
    playlists[0].playlistUri = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

$("#fldPlaylistName10").on( "input", function(event){
    playlists[0].playlistName = this.value;
    ipcRenderer.invoke('setPlaylists',playlists);
});

// End of playlists

$("#always_skip_tracks").on( "input", function(event){
    ipcRenderer.invoke('setPref','dayjob_always_skip_tracks',this.checked);
});

$("#always_move_tracks").on( "input", function(event){
    ipcRenderer.invoke('setPref','dayjob_always_move_tracks',this.checked);
});

// module.exports = {};
// module.exports.setNotification = function(notificationText){