///////////////////////////////////////////////////////////////////
//// Modules
///////////////////////////////////////////////////////////////////

// Type 'npm install DependencyName' on command prompt to install
// require('log-timestamp');
const electron = require('electron');
var shell = require('electron').shell;
const {app, globalShortcut, ipcMain} = require('electron');  //globalShortcut must be defined with app or it does not work
const menubar = require('menubar');
const spotifyServer = require('./spotify-server.js');
const prefsLocal = require('./prefs.js');
const fs = require ('fs');

///////////////////////////////////////////////////////////////////
////  Global variables
///////////////////////////////////////////////////////////////////

// Control application life
//app = electron.app  //Not required since defining app,globalShortcut together

// Create native browser windows (for all of UI)
const BrowserWindow = electron.BrowserWindow

// Variables for constructing URLs
const path = require('path')
const url = require('url')

///////////////////////////////////////////////////////////////////
////  Logging module
///////////////////////////////////////////////////////////////////

var log = require('electron-log');

log.warn('main.js:  dayjob started...');
log.warn('main.js:  \'__dirname\' path is reported as: ' + __dirname);
log.warn('main.js:  \'app.getAppPath\' path is reported as: ' + app.getAppPath());

///////////////////////////////////////////////////////////////////
////  Load error message db
///////////////////////////////////////////////////////////////////

let errors = JSON.parse(fs.readFileSync(__dirname + '/errors.json'));
console.log('main.js:  Loaded error handling database: ') // + JSON.stringify(errors));

///////////////////////////////////////////////////////////////////
////  Load application defaults
///////////////////////////////////////////////////////////////////

// Any variables that should have a default should be specified here

if (prefsLocal.getPref('dayjob_always_move_tracks') == undefined){prefsLocal.setPref('dayjob_always_move_tracks',0)}
if (prefsLocal.getPref('dayjob_always_skip_tracks') == undefined){prefsLocal.setPref('dayjob_always_skip_tracks',0)}

///////////////////////////////////////////////////////////////////
////  Load saved playlist array
///////////////////////////////////////////////////////////////////

// Playlist storage
var playlists = {};

// v1 playlist storage is an 11 object multimensional array (0 to 10), representing the keyboard keys `1234567890 in order
// Each array item contains an array with (keyboard_key,playlist_uri,playlist_name,boolean_move_track) 

if (prefsLocal.getPref('dayjob_playlists_v1') == undefined){
  // No playlists stored, create a blank array
  playlists = 
    {
      "1" : {playlistID: "", playlistName:""},
      "2" : {playlistID: "", playlistName:""},
      "3" : {playlistID: "", playlistName:""},
      "4" : {playlistID: "", playlistName:""},
      "5" : {playlistID: "", playlistName:""},
      "6" : {playlistID: "", playlistName:""},
      "7" : {playlistID: "", playlistName:""},
      "8" : {playlistID: "", playlistName:""},
      "9" : {playlistID: "", playlistName:""},
      "0" : {playlistID: "", playlistName:""},
    }
  prefsLocal.setPref('dayjob_playlists_v1',playlists);
}

else {
  // Load stored playlists
  playlists = prefsLocal.getPref('dayjob_playlists_v1');
}

///////////////////////////////////////////////////////////////////
////  Menu bar module
///////////////////////////////////////////////////////////////////

const mb = menubar({webPreferences: {nodeIntegration: true}});

mb.setOption('preload-window', true);
mb.setOption('height', 200);
mb.setOption('alwaysOnTop', true);
// Set app icon
mb.setOption('icon', app.getAppPath() + '/assets/IconTemplate.png')
// Set the initial page
mb.setOption('index', url.format({
  pathname: path.join(app.getAppPath(), '/src/notification.html'),
  protocol: 'file:',
  slashes: true
}))

///////////////////////////////////////////////////////////////////
//// Right click menu module
///////////////////////////////////////////////////////////////////

const Menu = electron.Menu;

const contextMenu = Menu.buildFromTemplate([
  // Item 0 - Preferences
  { label: 'Preferences', click: function () { openMainWindow('/src/ui-preferences.html'); } },
  // Item 0 - About menu
  { label: 'About dayjob', click: function () { openAbout(); } },
  // Separator
  { type: 'separator' },
  // Item 1 - Quit
  { label: 'Quit dayjob', click: function () { mb.app.quit(); } }
]);

///////////////////////////////////////////////////////////////////
//// Main window handler
///////////////////////////////////////////////////////////////////

let mainWindow;  // Prevent window closure on garbage collection

function openMainWindow(urlToOpen) {
  // To get a frameless window, add 'frame:false'
  mainWindow = new BrowserWindow({ maxWidth: 1024, maxHeight: 768, show: false, webPreferences: {nodeIntegration: true}});

  mainWindow.loadURL(url.format({
    pathname: path.join(app.getAppPath(), urlToOpen),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  log.warn('main.js:  Main window opened (set to open index.html');
  //await sleep(1000);

}

///////////////////////////////////////////////////////////////////
//// About window handler
///////////////////////////////////////////////////////////////////

let aboutWindow;  // Prevent window closure on garbage collection

function openAbout() {
  aboutWindow = new BrowserWindow({ width: 400, height: 350, maxWidth: 400, maxHeight: 350, show: false, webPreferences: {nodeIntegration: true}});

  aboutWindow.loadURL(url.format({
    pathname: path.join(app.getAppPath(), '/src/about.html'),
    protocol: 'file:',
    slashes: true
  }))

  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show()
  })

  aboutWindow.on('closed', function () {
    aboutWindow = null;
  });
}

///////////////////////////////////////////////////////////////////
//// Start-up options
///////////////////////////////////////////////////////////////////

// Open the DevTools.
// mainWindow.webContents.openDevTools() 

// Always open the window (test mode)

///////////////////////////////////////////////////////////////////
//// Spotify auth mechanism
///////////////////////////////////////////////////////////////////

function connectApi(){
  log.warn('main.js:  Attempting to connect to the Spotify API...');
  spotifyServer.checkApiConnection()
    .then(function (result) {

      showNotification({title: 'Connected to Spotify as ' + spotifyServer.getspotifyDisplayName(), description: 'Start making awesome playlists!'})
      // TODO - If the user has no saved playlists, reject with an error asking the user to create some playlists first
    }).catch(function (err) {
      logAndDisplayError(err)
    })
}
///////////////////////////////////////////////////////////////////
//// Applicacation start
///////////////////////////////////////////////////////////////////

// Actions after the window has first been rendered
mb.on('after-create-window', function ready() {
  log.warn('main.js:  Menubar after-create-window event happened.');
  mb.window.webContents.on('did-finish-load', function () {
    log.warn('main.js:  Menubar did-finish-load event happened.');
    // Waits for MB window to initialise & content to finish loading.
    // Interactions with notifcation window MUST only happen after this event or they are not dissplayed
    connectApi();  // Check API connection and warn the user if any action is required.
  });
});

app.on('ready', () => {
  log.warn('main.js:  App is ready to start.')

///////////////////////////////////////////////////////////////////
//// Keyboard shortcuts
///////////////////////////////////////////////////////////////////

  // There appears to be a bug with globalShortcut.registerAll so every key / modifier combination must be assigned separately
  // All shortcuts call keyPressed() and pass a JSON object with keys: "modifiers" and "key" 
  // Register CRTL + ALT shortcuts
  const ctrlAlt1 = globalShortcut.register('Control+Alt+1', () =>          {keyPressed({modifiers: ["Control","Alt"],key: "1"})});
  const ctrlAlt2 = globalShortcut.register('Control+Alt+2', () =>          {keyPressed({modifiers: ["Control","Alt"],key: "2"})});
  const ctrlAlt3 = globalShortcut.register('Control+Alt+3', () =>          {keyPressed({modifiers: ["Control","Alt"],key: "3"})});
  const ctrlAlt4 = globalShortcut.register('Control+Alt+4', () =>          {keyPressed({modifiers: ["Control","Alt"],key: "4"})});
  const ctrlAlt5 = globalShortcut.register('Control+Alt+5', () =>          {keyPressed({modifiers: ["Control","Alt"],key: "5"})});
  const ctrlAlt6 = globalShortcut.register('Control+Alt+6', () =>          {keyPressed({modifiers: ["Control","Alt"],key: "6"})});
  const ctrlAlt7 = globalShortcut.register('Control+Alt+7', () =>          {keyPressed({modifiers: ["Control","Alt"],key: "7"})});
  const ctrlAlt8 = globalShortcut.register('Control+Alt+8', () =>          {keyPressed({modifiers: ["Control","Alt"],key: "8"})});
  const ctrlAlt9 = globalShortcut.register('Control+Alt+9', () =>          {keyPressed({modifiers: ["Control","Alt"],key: "9"})});
  const ctrlAlt0 = globalShortcut.register('Control+Alt+0', () =>          {keyPressed({modifiers: ["Control","Alt"],key: "0"})});
  const ctrlAltMinus = globalShortcut.register('Control+Alt+-', () =>      {keyPressed({modifiers: ["Control","Alt"],key: "-"})});
  const ctrlAltPlus = globalShortcut.register('Control+Alt+=', () =>       {keyPressed({modifiers: ["Control","Alt"],key: "="})});
  // Register CRTL + ALT + SHIFT shortcuts
  const ctrlAltShf1 = globalShortcut.register('Control+Alt+Shift+1', () =>          {keyPressed({modifiers: ["Control","Alt","Shift"],key: "1"})});
  const ctrlAltShf2 = globalShortcut.register('Control+Alt+Shift+2', () =>          {keyPressed({modifiers: ["Control","Alt","Shift"],key: "2"})});
  const ctrlAltShf3 = globalShortcut.register('Control+Alt+Shift+3', () =>          {keyPressed({modifiers: ["Control","Alt","Shift"],key: "3"})});
  const ctrlAltShf4 = globalShortcut.register('Control+Alt+Shift+4', () =>          {keyPressed({modifiers: ["Control","Alt","Shift"],key: "4"})});
  const ctrlAltShf5 = globalShortcut.register('Control+Alt+Shift+5', () =>          {keyPressed({modifiers: ["Control","Alt","Shift"],key: "5"})});
  const ctrlAltShf6 = globalShortcut.register('Control+Alt+Shift+6', () =>          {keyPressed({modifiers: ["Control","Alt","Shift"],key: "6"})});
  const ctrlAltShf7 = globalShortcut.register('Control+Alt+Shift+7', () =>          {keyPressed({modifiers: ["Control","Alt","Shift"],key: "7"})});
  const ctrlAltShf8 = globalShortcut.register('Control+Alt+Shift+8', () =>          {keyPressed({modifiers: ["Control","Alt","Shift"],key: "8"})});
  const ctrlAltShf9 = globalShortcut.register('Control+Alt+Shift+9', () =>          {keyPressed({modifiers: ["Control","Alt","Shift"],key: "9"})});
  const ctrlAltShf0 = globalShortcut.register('Control+Alt+Shift+0', () =>          {keyPressed({modifiers: ["Control","Alt","Shift"],key: "0"})});
  const ctrlAltShfMinus = globalShortcut.register('Control+Alt+Shift+-', () =>      {keyPressed({modifiers: ["Control","Alt","Shift"],key: "-"})});
  const ctrlAltShfPlus = globalShortcut.register('Control+Alt+Shift+=', () =>       {keyPressed({modifiers: ["Control","Alt","Shift"],key: "="})});
  // Warn if registration of CRTL + ALT shortcuts fail
  // TODO - Should alert  the user if a keuyboard shortcut fails
  if (!ctrlAlt1) {log.warn('main.js:  registration failed of: ctrlAlt1 (Control+Alt+1)')};
  if (!ctrlAlt2) {log.warn('main.js:  registration failed of: ctrlAlt2 (Control+Alt+2)')};
  if (!ctrlAlt3) {log.warn('main.js:  registration failed of: ctrlAlt3 (Control+Alt+3)')};
  if (!ctrlAlt4) {log.warn('main.js:  registration failed of: ctrlAlt4 (Control+Alt+4)')};
  if (!ctrlAlt5) {log.warn('main.js:  registration failed of: ctrlAlt5 (Control+Alt+5)')};
  if (!ctrlAlt6) {log.warn('main.js:  registration failed of: ctrlAlt6 (Control+Alt+6)')};
  if (!ctrlAlt7) {log.warn('main.js:  registration failed of: ctrlAlt7 (Control+Alt+7)')};
  if (!ctrlAlt8) {log.warn('main.js:  registration failed of: ctrlAlt8 (Control+Alt+8)')};
  if (!ctrlAlt9) {log.warn('main.js:  registration failed of: ctrlAlt9 (Control+Alt+9)')};
  if (!ctrlAlt0) {log.warn('main.js:  registration failed of: ctrlAlt0 (Control+Alt+0)')};
  if (!ctrlAltMinus) {log.warn('main.js:  registration failed of: ctrlAltMinus (Control+Alt+-)')};
  if (!ctrlAltPlus) {log.warn('main.js:  registration failed of: ctrlAltPlus (Control+Alt+=)')};
  // Warn if registration of CRTL + ALT + SHIFT shortcuts fail
  // TODO - Should alert  the user if a keuyboard shortcut fails
  if (!ctrlAltShf1) {log.warn('main.js:  registration failed of: ctrlAlt1 (Control+Alt+Shift+1)')};
  if (!ctrlAltShf2) {log.warn('main.js:  registration failed of: ctrlAlt2 (Control+Alt+Shift+2)')};
  if (!ctrlAltShf3) {log.warn('main.js:  registration failed of: ctrlAlt3 (Control+Alt+Shift+3)')};
  if (!ctrlAltShf4) {log.warn('main.js:  registration failed of: ctrlAlt4 (Control+Alt+Shift+4)')};
  if (!ctrlAltShf5) {log.warn('main.js:  registration failed of: ctrlAlt5 (Control+Alt+Shift+5)')};
  if (!ctrlAltShf6) {log.warn('main.js:  registration failed of: ctrlAlt6 (Control+Alt+Shift+6)')};
  if (!ctrlAltShf7) {log.warn('main.js:  registration failed of: ctrlAlt7 (Control+Alt+Shift+7)')};
  if (!ctrlAltShf8) {log.warn('main.js:  registration failed of: ctrlAlt8 (Control+Alt+Shift+8)')};
  if (!ctrlAltShf9) {log.warn('main.js:  registration failed of: ctrlAlt9 (Control+Alt+Shift+9)')};
  if (!ctrlAltShf0) {log.warn('main.js:  registration failed of: ctrlAlt0 (Control+Alt+Shift+0)')};
  if (!ctrlAltShfMinus) {log.warn('main.js:  registration failed of: ctrlAltMinus (Control+Alt+Shift+-)')};
  if (!ctrlAltShfPlus) {log.warn('main.js:  registration failed of: ctrlAltPlus (Control+Alt+Shift+=)')};

  // Check whether a shortcut is registered.
  //log.warn(globalShortcut.isRegistered('CommandOrControl+X'))
});


///////////////////////////////////////////////////////////////////
//// Keyboard shortcut actions
///////////////////////////////////////////////////////////////////

function keyPressed(key){
  log.warn('main.js:  Keyboard shortcut pressed: Modifiers: ' + JSON.stringify(key.modifiers) + ', Key: ' + key.key);

  //// Remove track
  ///////////////////////////////////////////////////////////////////
  
  if (key.modifiers.includes('Control') && key.modifiers.includes('Alt') && key.key == '-'){
    // Determine if track should be moved
    var skip = 0;
    if (prefsLocal.getPref('dayjob_always_skip_tracks') == 0 && key.modifiers.includes('Shift')) {skip = 1} 
    if (prefsLocal.getPref('dayjob_always_skip_tracks') == 1 && !key.modifiers.includes('Shift')){skip = 1}
    log.warn('main.js:  Remove track keyboard shortcut pressed...');
    spotifyServer.removePlayingTrackFromPlaylist()
      .then(function (result) {
        // We're done, skip track, log and show notification
        showNotification({title: result.artistName + ' - ' + result.name, actionRemove: 'Removed from playlist \'' + result.context.sourcePlaylistName +'\''})
        if (skip == 1) {return spotifyServer.skipToNext()}
        else {return Promise.resolve('ready')} 
      }).catch(function (err) {
        logAndDisplayError(err)
      })
  }

  //// Add or move track to specifed playlist (+) 
  ///////////////////////////////////////////////////////////////////

  if (key.modifiers.includes('Control') && key.modifiers.includes('Alt') && key.key == '='){
    log.warn('main.js:  Add/move track to specified playlist (+) shortcut pressed... THIS FEATURE ISN\'T SUPPORTED YET SORRY!');
    // Add logic for copy / move - as below
    // Feature not supported yet, coming!
  }

  //// Add or more track to playlist in slot #
  ///////////////////////////////////////////////////////////////////
  
  if (key.modifiers.includes('Control') && key.modifiers.includes('Alt') && ['1','2','3','4','5','6','7','8','9','0'].includes(key.key)){
    var move = 0;
    return Promise.resolve().then(function () {
      // Check if a playlist is assigned to the slot
      if (playlists[key.key].playlistID == ''){        
        handledErr = new Error("no_playlist_assigned")
        handledErr.error = 'shortcut ' + key.key;
        return Promise.reject(handledErr);
      }
      return Promise.resolve('ready')
    }).then(function (result){
      // Determine if track should be moved
      if (prefsLocal.getPref('dayjob_always_move_tracks') == 0 && key.modifiers.includes('Shift')) {move = 1} 
      if (prefsLocal.getPref('dayjob_always_move_tracks') == 1 && !key.modifiers.includes('Shift')){move = 1}
      log.warn('main.js:  Add/move track to playlist in slot shortcut pressed:  Slot: ' + key.key + ' Move: ' + move);
      // Add the current track 
      return spotifyServer.copyOrMovePlayingTrackToPlaylist(playlists[key.key].playlistID,playlists[key.key].playlistName, move)
    }).then(function (result) {
      // We're done, skip track, log and show notification
      if (move == 0){
        // Track copied only
        showNotification({title: result.artistName + ' - ' + result.name, actionAdd: 'Added to playlist \'' + result.destPlaylistName +'\''})
      }
      else if (move == 1 && result.result == 'copied_and_not_moved' ) {
        // Track copied instead of moved (source is read only, we don't have the name) 
        showNotification({title: result.artistName + ' - ' + result.name, actionAdd: 'Added to playlist \'' + result.destPlaylistName +'\'', actionWarning: 'Not removed because the current source is read only', subDescription: '(' + result.context.name + ')'})
      }  
      else if (move == 1){
        // Track was moved
        showNotification({title: result.artistName + ' - ' + result.name, actionAdd: 'Added to playlist \'' + result.destPlaylistName +'\'', actionRemove: 'Removed from source playlist \'' + result.context.sourcePlaylistName + '\''})
      }    
      else {
        Promise.reject(new Error('Unknown error adding or moving track'))
      } 
    }).catch(function (err) {
      logAndDisplayError(err)
    })
  }

    //// UI test
  ///////////////////////////////////////////////////////////////////

  /* 

  if (key.modifiers.includes('Control') && key.modifiers.includes('Alt') && key.key == 't'){
    log.warn('main.js:  UI test activated');
    var uiData = {
      title: 'The title',
      description: 'The message esaf asdf sdaf adsf adsf adsf adsf adsf ad',
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
    showNotification(uiData);
    mb.window.webContents.send('updateUi', uiData)
    mb.window.showInactive();
    // When a notification occurs, close the window briefly after
    function doAfterDelay() { mb.hideWindow(); }
    setTimeout(doAfterDelay, 5000);
  }
  */



}


///////////////////////////////////////////////////////////////////
//// Notifications display
///////////////////////////////////////////////////////////////////

// An example version of the uiData object is defined in notifications.js

function showNotification(uiData) {
  mb.window.webContents.send('updateUi', uiData)
  //mb.showWindow();
  mb.window.showInactive();
  // When a notification occurs, close the window briefly after
  function doAfterDelay() { mb.hideWindow(); }
  setTimeout(doAfterDelay, 5000);
}

///////////////////////////////////////////////////////////////////
//// Log error
///////////////////////////////////////////////////////////////////

// TODO - Error printing is not robust and will cause a Promise Unhandled Rejection if 
// an error object is not in the speecified format - it should be revised

function logError(err){
  log.warn('main.js:  ERROR has occurred:  ' + err + '\n' + 
           'Stack:   ' + err.stack)
  
  // Check if the error was caused by an external module and log it     
  if (err.hasOwnProperty("error")){
    log.warn('main.js:  ERROR in eternal module has occurred:  ' + err.error + '\n' + 
    'Object:  ' + JSON.stringify(err.error) + '\n' + 
    'Stack :   ' + err.error.stack)
  }
}

///////////////////////////////////////////////////////////////////
//// Log and display error
///////////////////////////////////////////////////////////////////

// TODO - This also has unhandled exception issues, e.g. an unhandled exception occurs if the requested error message is not found in the DB

function logAndDisplayError(err) {
  // Check if the error was caused by an external module if so show in UI
  var externalError = ""
  if (err.hasOwnProperty("error")){externalError = '(' + err.error + ')'} // Show the external error in the UI
  // Log the error
  logError(err)
  // Look up the errors in the DB and show warning
  showNotification({title: errors[err.message].title, 
                    description: errors[err.message].description, 
                    subDescription: externalError,
                    buttonCta: {title: errors[err.message].actionTitle, 
                                action: errors[err.message].actionId},
                    errorType: errors[err.message].errorType})
  log.warn('main.js:  ERROR reported to the user: (' + errors[err.message].errorType + ') ' + errors[err.message].title + ': ' + errors[err.message].description + externalError)
}

// Actions after mb is ready but the window is not
mb.on('ready', function ready() {
  log.warn('main.js:  Menubar ready event happened.');

  // Notification messages are not being received until the window has been opened at least once.  Open it on start-up
  mb.showWindow();

  mb.tray.on('click', function () {
    log.warn('mb:  left-click event happened.');
  });

  //Context menu open
  mb.tray.on('right-click', function () {
    log.warn('mb:  right-click event happened.');
    mb.tray.popUpContextMenu(contextMenu);
  });

  // Show the window immediately after starting (test mode)
  //mb.showWindow();
});



///////////////////////////////////////////////////////////////////
//// IPC listeners
///////////////////////////////////////////////////////////////////

ipcMain.on('check_api_connection', function (event) {
  log.warn('main.js:  Event check_api_connection received by main process.');
  openMainWindow('/src/ui-preferences.html');
});

ipcMain.on('playlist_settings', function (event) {
  log.warn('main.js:  Event playlist_settings received by main process.');
  openMainWindow('/src/ui-preferences.html');
});

ipcMain.on('authorise_dayjob', function (event) {
  log.warn('main.js:  Event authorise_dayjob received by main process.');
  spotifyServer.getAuthUrl()
      .then(function (result) {
        shell.openExternal(result);
      }).catch(function (err) {
        logAndDisplayError(err)
      })
});

ipcMain.on('connect_api', function (event) {
  log.warn('main.js:  Event connect_api received by main process.');
  connectApi();
});

ipcMain.on('btnOpenDashboard', function (event) {
  log.warn('main.js:  Event btnOpenDashboard received by main process.');
  shell.openExternal('https://developer.spotify.com/dashboard/login');
});

// TODO - Test function, can be deleted
ipcMain.on('connect_api', function (event) {
  log.warn('main.js:  Event connect_api received by main process.');
});


/*

ipcMain.handle('my-invokable-ipc', async (event, ...args) => {
  log.warn('IPC main handler received args ' + args)
  const result = await Promise.resolve("invokable response") //somePromise(...args)
  return result
})

*/


// return spotifyServer.copyOrMovePlayingTrackToPlaylist(playlists[key.key].playlistID,playlists[key.key].playlistName, move)

ipcMain.on('asynchronous-message', function (event, arg) {
  log.warn('main.js:  ipc received \'asynchronous-message\' with args: ' + arg);
  //event.reply('getSavedPlaylistResponse', 'pong back')
  if (arg == 'passing in 2'){
    log.warn('Delaying it')
    function doAfterDelay() { 
      log.warn('Doing it now')
      //event.sender.send('asynchronous-reply2', 'message back');
      event.reply('asynchronous-reply2', 'message back');
    }
    setTimeout(doAfterDelay, 5000);
  }
  else {
    event.sender.send('asynchronous-reply', 'pong back');
  }
});

/*
// Likely to be obsolete
ipcMain.on('skip', function (event, data) {
  log.warn('main.js:  Spotify skip request with data ' + data);
  spotifyAudioControl.skip(data); // replace with spotifyServer.skipToNext()  
});
*/


/*
ipcMain.on('btnOpenNewWindow', function(event, arg) {
  log.warn('ipcMain:  received argument ' + arg);
  //do child process or other data manipulation and name it manData
  //event.sender.send(‘manipulatedData’, manData);
});
 
*/
///////////////////////////////////////////////////////////////////
//// Applicacation end
///////////////////////////////////////////////////////////////////

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  log.warn('app:  window-all-closed event happened.');
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', function () {
  log.warn('app:  will-quit event happened.');
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
})

