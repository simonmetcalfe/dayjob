
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

const btnSkipTrack = document.getElementById('btnOpenNewWindow');
btnSkipTrack.addEventListener('click',function(event){
    log.warn('notification.js:  btnSkipTrack event raised');
    browserWindow.webContents.sendInputEvent({
        type: "keyDown",
        keyCode: '\u0008'
      });
      
      browserWindow.webContents.sendInputEvent({
        type: "keyUp",
        keyCode: '\u0008'
      });
    //ipcRenderer.send('btnSkipTrack');

})

///////////////////////////////////////////////////////////////////
//// Exported methods
///////////////////////////////////////////////////////////////////

// module.exports = {};

// module.exports.setNotification = function(notificationText){
