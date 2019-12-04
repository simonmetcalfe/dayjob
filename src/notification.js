
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
    subDescription: 'The small text',
    actionAdd:'Adding this track', 
    actionRemove:'Removing this track', 
    actionWarning:'This is a warning',
    actionError:'This is an error',
    buttonCta: {
        title: 'The button title',
        action: 'the_button_action'
    },
    errorType: 'error'
}
*/ 

///////////////////////////////////////////////////////////////////
//// Reset UI
///////////////////////////////////////////////////////////////////

function resetUi(){
    document.getElementById('title').style.display = 'none';
    document.getElementById('description').style.display = 'none';
    document.getElementById('warning').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('actionAdd').style.display = 'none';
    document.getElementById('actionRemove').style.display = 'none';
    document.getElementById('actionWarning').style.display = 'none';
    document.getElementById('actionError').style.display = 'none';
    document.getElementById('subDescription').style.display = 'none';
    document.getElementById('buttonCta').style.display = 'none';
}

resetUi(); // Reset the UI on startup (saves hiding everything in CSS)

///////////////////////////////////////////////////////////////////
//// IPC listeners
///////////////////////////////////////////////////////////////////

ipcRenderer.on('updateUi', (event, arg) =>  {
    resetUi();
    uiData = arg;
    log.warn('Notification.js:  updateUI has received the following uiData JSON: ' + JSON.stringify(uiData))
    if (uiData.hasOwnProperty('title') && !uiData.hasOwnProperty('errorType')){
        document.getElementById('title').innerHTML = uiData.title;
        document.getElementById('title').style.display = 'block';
        // Title is never hidden, so calling .style.display is not required
    }
    if (uiData.hasOwnProperty('title') && uiData.hasOwnProperty('errorType') && uiData.errorType == 'warning' ){
        document.getElementById('warning').innerHTML = uiData.title;
        document.getElementById('warning').style.display = 'block';
    }
    if (uiData.hasOwnProperty('title') && uiData.hasOwnProperty('errorType') && uiData.errorType == 'error' ){
        document.getElementById('error').innerHTML = uiData.title;
        document.getElementById('error').style.display = 'block';
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
    if (uiData.hasOwnProperty('subDescription')){
        document.getElementById('subDescription').innerHTML = uiData.subDescription;
        document.getElementById('subDescription').style.display = 'block';
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
