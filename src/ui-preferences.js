/**
 * -----------------------------------------------------------------
 * Logging
 * -----------------------------------------------------------------
 */

var log = require('electron-log');
log.warn('ui-preferences.js:  The ui-preferences.js script has run...');

/**
 * -----------------------------------------------------------------
 * Modules
 * -----------------------------------------------------------------
 */

const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
window.$ = window.jQuery = require('jquery')
window.Tether = require('tether')
window.Bootstrap = require('bootstrap')

/**
 * -----------------------------------------------------------------
 * Variables
 * -----------------------------------------------------------------
 */

var playlists = {}; // Easier to read/write to playlust object here


/**
 * -----------------------------------------------------------------
 * Retrieve data on load
 * -----------------------------------------------------------------
 */

async () => {
    // This is required - unsure why
}

(async () => {
    try {
        
        
    } 
    catch (e) {
        // Deal with the fact the chain failed
        ipcRenderer.invoke('logAndDisplayError','error_reading_preferences');
    }
})();



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

