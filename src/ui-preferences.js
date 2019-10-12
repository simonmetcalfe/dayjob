///////////////////////////////////////////////////////////////////
//// Included modules
///////////////////////////////////////////////////////////////////

// 'use strict'

const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
var log = require('electron-log');

// Bootstrap
window.$ = window.jQuery = require('jquery')
window.Tether = require('tether')
window.Bootstrap = require('bootstrap')

///////////////////////////////////////////////////////////////////
//// Button event listeners
///////////////////////////////////////////////////////////////////

$("#btnOpenDashboard").on( "click", function(event){
    ipcRenderer.send('btnOpenDashboard');
});

$("#btnConnectToSpotify").on( "click", function(event){
    console.log($('#fldClientId').val());
    ipcRenderer.send('btnConnectToSpotify');
});

// module.exports = {};
// module.exports.setNotification = function(notificationText){