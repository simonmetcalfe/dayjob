
///////////////////////////////////////////////////////////////////
//// Included modules
///////////////////////////////////////////////////////////////////

const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
var log = require('electron-log');

log.warn('notification.js:  script running.');

///////////////////////////////////////////////////////////////////
//// IPC listeners
///////////////////////////////////////////////////////////////////

ipcRenderer.on('setNotificationText', (event, arg) =>  {
    document.getElementById('notificationText').innerHTML = arg;
}); 

ipcRenderer.on('setTrackName', (event, arg) =>  {
    document.getElementById('trackName').innerHTML = arg;
}); 

ipcRenderer.on('setTrackArtist', (event, arg) =>  {
    document.getElementById('trackArtist').innerHTML = arg;
}); 

ipcRenderer.on('setTrackAlbum', (event, arg) =>  {
    document.getElementById('trackAlbum').innerHTML = arg;
}); 

///////////////////////////////////////////////////////////////////
//// Button event listeners
///////////////////////////////////////////////////////////////////

const btnOpenNewWindow = document.getElementById('btnOpenNewWindow');
btnOpenNewWindow.addEventListener('click',function(event){
    log.warn('notification.js:  btnOpenNewWindow event raised');
    ipcRenderer.send('btnOpenNewWindow');
})

///////////////////////////////////////////////////////////////////
//// Exported methods
///////////////////////////////////////////////////////////////////

// module.exports = {};

// module.exports.setNotification = function(notificationText){
