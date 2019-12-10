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
//// IPC function
///////////////////////////////////////////////////////////////////

function getData(id, args){
    return new Promise(resolve => {
        log.warn('ui-preferences.js:  getData sending asynchronous-message with data: ' + args)
        ipcRenderer.send(channel, id, args)
        ipcRenderer.on('asynchronous-reply', (event, result) => {
            log.warn('ui-preferences.js:  getData received asynchronous-reply for data ' + args + '\': ' + result)
            resolve(result);
        })
    });
}

/*

async () => {
    log.warn('Doing ASYNC with \'argsent\'')
    const result = await ipcRenderer.invoke('my-invokable-ipc', "argsent")
    log.warn('Result from \'argsent\' is ' + result)
    // ...
}

*/

///////////////////////////////////////////////////////////////////
//// Retrieve data on load
///////////////////////////////////////////////////////////////////

//ipcRenderer.send('getSavedPlaylist','test ipcrendered');

//log.warn('Testing getData, it gives response ' + getData("passing in"))

getData("passing in")
    .then(function(result){
        document.getElementById('fldClientId').value = result;
    }).catch(function(err){
        document.getElementById('fldClientId').value = err;
    })

getData("passing in 2")
    .then(function(result){
        document.getElementById('fldClientSecret').value = result;
    }).catch(function(err){
        document.getElementById('fldClientSecret').value = err;
    })

//document.getElementById('fldClientId').value = Promise.resolve().then getData("passing in")

// document.getElementById('fldClientId').value = "test value";
//document.getElementById('fldClientSecret').value = "test value";
document.getElementById('lblConnectionStatus').innerHtml = "test value";

document.getElementById('fldPlaylistId1').value = "test value";
document.getElementById('fldPlaylistName1').value = "test value";

document.getElementById('fldPlaylistId2').value = "test value";
document.getElementById('fldPlaylistName2').value = "test value";

document.getElementById('fldPlaylistId3').value = "test value";
document.getElementById('fldPlaylistName3').value = "test value";

document.getElementById('fldPlaylistId4').value = "test value";
document.getElementById('fldPlaylistName4').value = "test value";

document.getElementById('fldPlaylistId5').value = "test value";
document.getElementById('fldPlaylistName5').value = "test value";

document.getElementById('fldPlaylistId6').value = "test value";
document.getElementById('fldPlaylistName6').value = "test value";

document.getElementById('fldPlaylistId7').value = "test value";
document.getElementById('fldPlaylistName7').value = "test value";

document.getElementById('fldPlaylistId8').value = "test value";
document.getElementById('fldPlaylistName8').value = "test value";

document.getElementById('fldPlaylistId9').value = "test value";
document.getElementById('fldPlaylistName9').value = "test value";

document.getElementById('fldPlaylistId10').value = "test value";
document.getElementById('fldPlaylistName10').value = "test value";

document.getElementById('always_skip_tracks').checked = true;
document.getElementById('always_move_tracks').checked = false;
document.getElementById('launch_at_startup').checked = true;

///////////////////////////////////////////////////////////////////
//// Button event listeners
///////////////////////////////////////////////////////////////////

$("#btnOpenDashboard").on( "click", function(event){
    ipcRenderer.send('btnOpenDashboard');
});

$("#btnConnectToSpotify").on( "click", function(event){
    log.warn($('#fldClientId').val());
    ipcRenderer.send('btnConnectToSpotify');
});

$("#fldClientId").on( "load", function(event){
    log.warn("fldClientId was loaded");
    //ipcRenderer.send('btnConnectToSpotify');
});

$("#fldClientId").on( "input", function(event){
    log.warn("fldClientId updated to " + this.value);
    //ipcRenderer.send('btnConnectToSpotify');
});

// module.exports = {};
// module.exports.setNotification = function(notificationText){