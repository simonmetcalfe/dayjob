
///////////////////////////////////////////////////////////////////
//// Included modules
///////////////////////////////////////////////////////////////////

const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
var log = require('electron-log');

log.warn('notification.js:  The notification.js script has run...');

///////////////////////////////////////////////////////////////////
//// Variables
///////////////////////////////////////////////////////////////////

var uiData // Data passsed to the notification window to configure its appearance

///////////////////////////////////////////////////////////////////
//// Example uiData JSON Object
///////////////////////////////////////////////////////////////////
/*
uiData = {
    title: 'The title',
    description: 'The dialog box message',
    actionAdd:'Adding this track', 
    actionRemove:'Removing this track', 
    actionWarning:'This is a warning',
    actionError:'This is an error',
    buttonCta: {
        title: 'The button title',
        action: 'the_button_action'
    },
    status: 'error'
}
*/ 

///////////////////////////////////////////////////////////////////
//// Reset UI
///////////////////////////////////////////////////////////////////

function resetUi(){
    document.getElementById('description').style.display = 'none';
    document.getElementById('actionAdd').style.display = 'none';
    document.getElementById('actionRemove').style.display = 'none';
    document.getElementById('actionWarning').style.display = 'none';
    document.getElementById('actionError').style.display = 'none';
    document.getElementById('buttonCta').style.display = 'none';
}

resetUi(); // Reset the UI on startup (saves hiding everything in CSS)

///////////////////////////////////////////////////////////////////
//// IPC listeners
///////////////////////////////////////////////////////////////////

ipcRenderer.on('updateUi', (event, arg) =>  {
    resetUi();
    uiData = arg;
    if (uiData.hasOwnProperty('title')){
        document.getElementById('title').innerHTML = uiData.title;
        // Title is never hidden, so calling .style.display is not required
    }
    if (uiData.hasOwnProperty('description')){
        document.getElementById('description').innerHTML = uiData.description;
        document.getElementById('description').style.display = 'block';
    }
    if (uiData.hasOwnProperty('actionAdd')){
        document.getElementById('actionAdd').innerHTML = uiData.actionAdd;
        document.getElementById('actionAdd').style.display = 'block';
    }
    if (uiData.hasOwnProperty('actionRemove')){
        document.getElementById('actionRemove').innerHTML = uiData.actionRemove;
        document.getElementById('actionRemove').style.display = 'block';
    }
    if (uiData.hasOwnProperty('actionWarning')){
        document.getElementById('actionWarning').innerHTML = uiData.actionWarning;
        document.getElementById('actionWarning').style.display = 'block';
    }
    if (uiData.hasOwnProperty('actionError')){
        document.getElementById('actionError').innerHTML = uiData.actionError;
        document.getElementById('actionError').style.display = 'block';
    }
    if (uiData.hasOwnProperty('buttonCta') && !uiData.buttonCta.action == ''){
        document.getElementById('buttonCta').innerHTML = uiData.buttonCta.title;
        document.getElementById('buttonCta').style.display = 'inline-block';
    }

}); 

///////////////////////////////////////////////////////////////////
//// Button event listeners
///////////////////////////////////////////////////////////////////

const buttonCta = document.getElementById('buttonCta');
buttonCta.addEventListener('click',function(event){
    log.warn('notification.js:  buttonCta clicked and passing action: ' + uiData.buttonCta.action);
    ipcRenderer.send(uiData.buttonCta.action);
})




///////////////////////////////////////////////////////////////////
//// Exported methods
///////////////////////////////////////////////////////////////////

// module.exports = {};

// module.exports.setNotification = function(notificationText){
