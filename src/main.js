const {app, BrowserWindow, globalShortcut, ipcMain, dialog} = require('electron');  //globalShortcut must be defined with app or it does not work
const electron = require('electron');
require('v8-compile-cache');

/**
 * -------------------------------------------------------------------------------------------------
 * Logging & app start
 * -------------------------------------------------------------------------------------------------
 */

var log = require('electron-log');

log.warn('main.js:  Starting application\n\n' +
         '*********************************\n' + 
         '* dayjob started...             *\n' + 
         '*********************************\n');

log.warn('main.js:  \'__dirname\' path is reported as: ' + __dirname);
log.warn('main.js:  \'app.getAppPath\' path is reported as: ' + app.getAppPath());

/**
 * -------------------------------------------------------------------------------------------------
 * Modules
 * -------------------------------------------------------------------------------------------------
 */

var shell = require('electron').shell;
const { menubar } = require('menubar');
const spotifyServer = require('./spotify-server.js');
const prefsLocal = require('./prefs.js');
const fs = require ('fs');
const path = require('path') // For constructing URLs
const url = require('url')

/**
 * -------------------------------------------------------------------------------------------------
 * Variables
 * -------------------------------------------------------------------------------------------------
 */

let notificationTimer = null;

/**
 * -------------------------------------------------------------------------------------------------
 * Content Security Policy
 * 
 * Requried to prevent security warnings in the Chrome console(s).
 * Applied using mainWindow.webContents.session.webRequest.onHeadersReceived
 * -------------------------------------------------------------------------------------------------
 */

const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; img-src 'self' data:;";


/**
 * -------------------------------------------------------------------------------------------------
 * Unhandled Promise rejection handling
 * -------------------------------------------------------------------------------------------------
 */

// In case of a programming error resulting in an unhandled rejection, the user will receive a message
process.on('unhandledRejection', err => {
  log.warn('main.js:  [ERROR]  Unhandled promise rejection.  This should be logged as a bug on the dayjob GitHub page.  Error:  \n\n' + String(err.message) + '\n' + 
  'Stack:   ' + err.stack);
  dialog.showMessageBox(null, {message: 'dayjob encountered an error \n\nUnhandled promise rejection.  Please log a bug on the dayjob GitHub page.\n\n' + err.message});
});

/**
 * -------------------------------------------------------------------------------------------------
 * Load notification/error message db
 * -------------------------------------------------------------------------------------------------
 */

let notifications = JSON.parse(fs.readFileSync(__dirname + '/notification.json'));
log.warn('main.js:  Loaded notification/error handling database') 

/**
 * -------------------------------------------------------------------------------------------------
 * Load application defaults
 * 
 * Any variables that should have a default should be specified here
 * -------------------------------------------------------------------------------------------------
 */

if (prefsLocal.getPref('dayjob_always_move_tracks') == undefined){prefsLocal.setPref('dayjob_always_move_tracks',false)}
if (prefsLocal.getPref('dayjob_always_skip_tracks') == undefined){prefsLocal.setPref('dayjob_always_skip_tracks',false)}

/**
 * -------------------------------------------------------------------------------------------------
 * Load saved playlist array
 * 
 * v1 playlist storage is an 10 object multimensional array (0 to 9), representing the 
 * keyboard keys 1234567890 in order
 * 
 * Array item 0 is keyboard button 1
 * -------------------------------------------------------------------------------------------------
 */

var playlists = {};

// 
if (prefsLocal.getPref('dayjob_playlists_v1') == undefined){
  // No playlists stored, create a blank array
  playlists = 
    {
      "1" : {playlistUri: "", playlistName:""},
      "2" : {playlistUri: "", playlistName:""},
      "3" : {playlistUri: "", playlistName:""},
      "4" : {playlistUri: "", playlistName:""},
      "5" : {playlistUri: "", playlistName:""},
      "6" : {playlistUri: "", playlistName:""},
      "7" : {playlistUri: "", playlistName:""},
      "8" : {playlistUri: "", playlistName:""},
      "9" : {playlistUri: "", playlistName:""},
      "0" : {playlistUri: "", playlistName:""},
    }
  prefsLocal.setPref('dayjob_playlists_v1',playlists);
}

else {
  // Load stored playlists
  playlists = prefsLocal.getPref('dayjob_playlists_v1');
}

/**
 * -------------------------------------------------------------------------------------------------
 * Right click menu module
 * -------------------------------------------------------------------------------------------------
 */

const Menu = electron.Menu;

const contextMenu = Menu.buildFromTemplate([
  // Item 0 - Preferences
  { label: 'Preferences', click: () => { openPrefsWindow(); } },
  // Item 0 - About menu
  { label: 'About dayjob', click: () => { openAbout(); } },
  // Separator
  { type: 'separator' },
  // Item 1 - Quit
  { label: 'Quit dayjob', click: () => { mb.app.quit(); } }
]);


/**
 * -------------------------------------------------------------------------------------------------
 * Menu bar module and window handler
 * -------------------------------------------------------------------------------------------------
 */

const mb = menubar({preloadWindow: true,
                    alwaysOnTop:true,
                    browserWindow:{
                      height:230,
                      webPreferences: {
                        nodeIntegration: false, 
                        contextIsolation: true, 
                        nodeIntegrationInWorker: false, 
                        nodeIntegrationInSubFrames: false, 
                        sandbox: false, 
                        preload: path.resolve("./src/notificationPreload.mjs")
                      },
                    },
                    icon: app.getAppPath() + '/assets/IconTemplate.png',
                    index: 'about:blank' // The preload, CSP and web page is loaded after menubar initialises
});


/**
 * -------------------------------------------------------------------------------------------------
 * Preferences window handler
 * -------------------------------------------------------------------------------------------------
 */

let prefsWindow;  // Prevent window closure on garbage collection

function openPrefsWindow() {
  log.warn('main.js:  Opening preferences window... ');
  // To get a frameless window, add 'frame:false'
  prefsWindow = new BrowserWindow({ maxWidth: 1024, 
                                    maxHeight: 768, 
                                    show: false, 
                                    webPreferences: {
                                      nodeIntegration: false,
                                      contextIsolation: true,
                                      nodeIntegrationInWorker: false,
                                      nodeIntegrationInSubFrames: false,
                                      sandbox: false, 
                                      preload: path.resolve("./src/ui-preferencesPreload.mjs")}});

  // Content security policy
  prefsWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
        responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [CSP],
        },
    });
  });

  prefsWindow.loadFile("./src/ui-preferences.html");

  prefsWindow.once('ready-to-show', () => {
    prefsWindow.show()
  })

  prefsWindow.on('closed', () => {
    prefsWindow = null;
  });
  //await sleep(1000);
}

/**
 * -------------------------------------------------------------------------------------------------
 * About window handler
 * -------------------------------------------------------------------------------------------------
 */

let aboutWindow;  // Prevent window closure on garbage collection

function openAbout() {
  aboutWindow = new BrowserWindow({ width: 400, 
                                    height: 450, 
                                    maxWidth: 400, 
                                    maxHeight: 450, 
                                    show: false, 
                                    webPreferences: {
                                      nodeIntegration: false, 
                                      contextIsolation: true,
                                      nodeIntegrationInWorker: false,
                                      nodeIntegrationInSubFrames: false,
                                      sandbox: false, 
                                      preload: path.resolve("./src/aboutPreload.mjs")
                                    }
  });

  // Content security policy
  aboutWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
        responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [CSP],
        },
    });
  });
  
  aboutWindow.loadFile("./src/about.html");

  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show()
  })

  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });
}

/**
 * -------------------------------------------------------------------------------------------------
 * Spotify auth mechanism
 * -------------------------------------------------------------------------------------------------
 */

function connectApi(){
  log.warn('main.js:  Attempting to connect to the Spotify API...');
  spotifyServer.checkApiConnection()
    .then(result => {
      showNotification({title: 'Connected to Spotify as ' + spotifyServer.getspotifyDisplayName(), description: 'Start making awesome playlists!'})

      //TODO - If the user has no saved playlists, reject with an error asking the user to create some playlists first
    }).catch(err => {
      logAndDisplayError(err)
    })
}

function authoriseDayjob(){
  if (spotifyServer.getWebServer() == undefined){
    // Start the web server if not already started
    spotifyServer.startWebServer();
  }
  else {
    log.warn('main.js:  The web server is already running.');
  }
  // Ensure the web server has started before launching the auth URL
  (async () => {
    try {
      // Wait for the server to start
      const message = await spotifyServer.checkIfWebServerReady();
      console.log(message);
      
      // Launch the auth URL
      log.warn('main.js:  Launching the Spotify authorisation URL...');
      spotifyServer.getAuthUrl()
        .then(result => {
          const handledErr = new Error("waiting_for_spotify_to_auth");
          logAndDisplayError(handledErr);
          shell.openExternal(result);
        }).catch(err => {
          logAndDisplayError(err)
        });

    } catch (error) {
      log.warn('main.js:  Unable to launch the Spotify authorisation URL...');
      console.error(error);
    }
  })();
}


/**
 * -------------------------------------------------------------------------------------------------
 * Monitor auth events from web server
 * 
 * 
 * -------------------------------------------------------------------------------------------------
 */

spotifyServer.getAuthEvents().on('auth_code_grant_error', err => { 
  console.log('Main.js:  Auth event \'auth_code_grant_error\' has been raised by spotify-server.js, reporting the error.... ' +  err);
  const handledErr = new Error('error_authorising')
  handledErr.error = err;
  logAndDisplayError(handledErr);
  spotifyServer.stopWebServer();
})

spotifyServer.getAuthEvents().on('auth_code_grant_success', result => {
  spotifyServer.stopWebServer();
  console.log('Main.js:  Auth event \'auth_code_grant_success\' has been raised by spotify-server.js, now connecting API... ' +  result);
  connectApi();
})

spotifyServer.getAuthEvents().on('ready', result => {   
  // This is for information only.  The fuction checkIfWebServerReady() is now used to check if the web server is ready
  log.warn('Main.js:  Auth event \'ready\' has been raised by spotify-server.js.');
})  

spotifyServer.getAuthEvents().on('server_stopped', result => {  
  // Information only
  log.warn('Main.js:  Auth event \'server_stopped\' has been raised by spotify-server.js.');
})  

spotifyServer.getAuthEvents().on('webserver_port_in_use', result => {  
  log.warn('Main.js:  [ERROR] Auth event \'webserver_port_in_use\' has been raised by spotify-server.js.  Port 8888 is in use but required by dayjob to authorise with Spotify.  Ensure port is free and start dayjob again.  Error: ' + String(result.message));
  const handledErr = new Error("webserver_port_in_use");
  handledErr.error = result;
  logAndDisplayError(handledErr); 
})  

spotifyServer.getAuthEvents().on('webserver_general_error', result => {  
    log.warn('Main.js:  [ERROR] Auth event \'webserver_general_error\' has been raised by spotify-server.js.  Error: ' + String(result.message));
    const handledErr = new Error("webserver_general_error");
    handledErr.error = result;
    logAndDisplayError(handledErr);
})  


/**
 * -------------------------------------------------------------------------------------------------
 * Applicacation start
 * -------------------------------------------------------------------------------------------------
 */

// Electron app start occurs before GUI is ready, so instead we use Menubar's 'after-create-window' event for most tasks
app.on('ready', () => {
  log.warn('main.js:  app.on ready event occurred...');
});

// When menubar is loaded open the notification window to initialise it
mb.on('ready', () => {
  log.warn('main.js:  mb.on ready event occurred...');

  // Load content security policy
  mb.window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
        responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [CSP],
        },
    });
  });
  
  // Load UI (Unlike ordinary BrowserWindows, MenuBar must be initialised before URL can be set via window object)
  mb.window.loadFile("./src/notification.html");

  // Trigger menubar notification window to align it to the toolbar
  mb.showWindow();  

  mb.tray.on('click', () => {
    log.warn('main.js:  mb.tray.on click event occurred...');
  });

  //Context menu open
  mb.tray.on('right-click', () => {
    log.warn('main.js:  mb.tray.on right-click event occurred...');
    mb.tray.popUpContextMenu(contextMenu);
  });
})

// Actions after the window has first been rendered
mb.on('after-create-window', (ready) => {
  log.warn('main.js:  mb.on after-create-window event occurred...');

  // Menubar requires the window to be fully loaded before we can send data to it
  mb.window.webContents.on('did-finish-load', () => {
    log.warn('main.js:  mb.window.webContents.on did-finish-load event occurred...');
    // Try connecting to Spotify on start-up and show welcome message or error status to user
    registerKeyboardShortcuts();
    connectApi();
  })
});


/**
 * -------------------------------------------------------------------------------------------------
 * SETUP KEYBOARD SHORTCUTS
 * 
 * There appears to be a bug with globalShortcut.registerAll so every key / modifier 
 * combination must be assigned separately
 * 
 * All shortcuts call keyPressed() and pass a JSON object with keys: "modifiers" and "key" 
 * 
 * -------------------------------------------------------------------------------------------------
 */

function registerKeyboardShortcuts(){
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
  //TODO: Should alert the user if a keuyboard shortcut fails
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
  //TODO: Should alert  the user if a keuyboard shortcut fails
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
}


/**
 * -------------------------------------------------------------------------------------------------
 * Keyboard shortcut actions
 * -------------------------------------------------------------------------------------------------
 */

function keyPressed(key){
  log.warn('main.js:  Keyboard shortcut pressed: ' + JSON.stringify(key.modifiers) + ' AND ' + key.key);

/**
 * -------------------------------------------------------------------------------------------------
 * Remove track
 * -------------------------------------------------------------------------------------------------
 */
  
  if (key.modifiers.includes('Control') && key.modifiers.includes('Alt') && key.key == '-'){
    var skip = 0; // Determine if track should be skipped as well as moved
    if (prefsLocal.getPref('dayjob_always_skip_tracks') == 0 && key.modifiers.includes('Shift')) {skip = 1} 
    if (prefsLocal.getPref('dayjob_always_skip_tracks') == 1 && !key.modifiers.includes('Shift')){skip = 1}
    log.warn('main.js:  Remove track keyboard shortcut pressed...');
    spotifyServer.removePlayingTrackFromPlaylist()
      .then(result => {
        // We're done, skip track, log and show notification
        showNotification({title: result.artistName + ' - ' + result.name, actionRemove: 'Removed from playlist \'' + result.context.sourcePlaylistName +'\''})
        if (skip == 1) {return spotifyServer.skipToNext()}
        else {return 'ready'} 
      }).catch(err => {
        logAndDisplayError(err)
      })
  }


/**
 * -------------------------------------------------------------------------------------------------
 * Add or move track to specifed playlist (+) 
 * -------------------------------------------------------------------------------------------------
 */


  if (key.modifiers.includes('Control') && key.modifiers.includes('Alt') && key.key == '='){
    log.warn('main.js:  Add/move track to specified playlist (+) shortcut pressed... THIS FEATURE ISN\'T SUPPORTED YET SORRY!');
    // Add logic for copy / move - as below
    //TODO: Feature not supported yet, coming!
  }


/**
 * -------------------------------------------------------------------------------------------------
 * Add or more track to playlist in slot #
 * -------------------------------------------------------------------------------------------------
 */
  
  if (key.modifiers.includes('Control') && key.modifiers.includes('Alt') && ['1','2','3','4','5','6','7','8','9','0'].includes(key.key)){
    var move = 0;
    return Promise.resolve().then(result => {
      // Check if a playlist is assigned to the slot
      if (playlists[key.key].playlistUri == ''){        
        const handledErr = new Error("no_playlist_assigned")
        handledErr.error = 'shortcut ' + key.key;
        return Promise.reject(handledErr);
      }
      return 'ready';
    }).then(result => {
      // Determine if track should be added or moved
      if (prefsLocal.getPref('dayjob_always_move_tracks') == 0 && key.modifiers.includes('Shift')) {move = 1} 
      if (prefsLocal.getPref('dayjob_always_move_tracks') == 1 && !key.modifiers.includes('Shift')){move = 1}
      log.warn('main.js:  Add/move track to playlist in slot shortcut pressed:  Slot: ' + key.key + ' Move: ' + move);
      // Add the current track 
      return spotifyServer.copyOrMovePlayingTrackToPlaylist(spotifyServer.getPlaylistIdFromUriOrUrl(playlists[key.key].playlistUri),playlists[key.key].playlistName, move)
    }).then(result => {
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
        return Promise.reject(new Error('Unknown error adding or moving track'))
      } 
    }).catch(err => {
      logAndDisplayError(err)
    })
  }
}


/**
 * -------------------------------------------------------------------------------------------------
 * Notifications display
 * 
 * An example version of how the uiData object should be formatted
 * is defined in notifications.js
 * 
 * -------------------------------------------------------------------------------------------------
 */


function showNotification(uiData) {
  mb.window.webContents.send('updateUi', uiData);
  mb.window.showInactive(); 
  // When a notification occurs, close the window briefly after, and reset timer if multiple notifications occur

  if (notificationTimer) {
    clearTimeout(notificationTimer);
  }

  notificationTimer = setTimeout(() => {
      mb.window.hide(); // mb.hideWindow() no longer works when using mb.window.showInactive() instead of mb.showWindow()
      notificationTimer = null;
  }, 5000);
}

/**
 * -------------------------------------------------------------------------------------------------
 * Log error
 * -------------------------------------------------------------------------------------------------
 */

function logError(err){
  try {
    log.warn('main.js:  [ERROR] has occurred:  ' + err + '\n' + 
            'Stack:   ' + err.stack)
    
    // Check if the error was caused by an external module and log it     
    if (err.hasOwnProperty("error")){
      log.warn('main.js:  [ERROR] in external module has occurred:  ' + err.error + '\n' + 
      'Object:  ' + JSON.stringify(err.error) + '\n' + 
      'Stack :   ' + err.error.stack)
    }
  } 
  catch (errCaught) {
    log.warn('main.js:  [ERROR]  Exception when handling an error.  This should be logged as a bug on the dayjob GitHub page.  Error:  ' + String(errCaught))
    dialog.showMessageBox(null, {message: 'dayjob encountered an error \n\nException when handling an error.  This should be logged as a bug on the dayjob GitHub page. \n\n' + errCaught.message});
  }  
}

/**
 * -------------------------------------------------------------------------------------------------
 * Log and display error
 * -------------------------------------------------------------------------------------------------
 */

function logAndDisplayError(err) {
  try {
    // Check if the error was caused by an external module if so show in UI
  var externalError = ""
  if (err.hasOwnProperty("error")){externalError = '(' + err.error + ')'} // Show the external error in the UI
  // Log the error
  logError(err)
  // Look up the notifications/errors in the DB and show warning
  showNotification({title: notifications[err.message].title, 
                    description: notifications[err.message].description, 
                    subDescription: externalError,
                    buttonCta: {title: notifications[err.message].actionTitle, 
                                action: notifications[err.message].actionId},
                    errorType: notifications[err.message].errorType})
  log.warn('main.js:  [ERROR] Error reported to the user: (' + notifications[err.message].errorType + ') ' + notifications[err.message].title + ': ' + notifications[err.message].description + externalError);
  }
  catch (errCaught){
    showNotification({title: 'Cannot display error', 
                      description: 'An exception occurred when trying to display an error.  If the problem persists please seek help on the dayjob GitHub page.', 
                      subDescription: String(err),
                      errorType: 'error'})
    log.warn('main.js:  [ERROR]:  Exception when handling an error.  This should be logged as a bug on the dayjob GitHub page.  Error:  ' + String(errCaught))
  }  
}

/**
 * -------------------------------------------------------------------------------------------------
 * IPC listeners
 * -------------------------------------------------------------------------------------------------
 */

//TODO - For consistency the old ipcMain.on functions could updated to ipcMain.handle 

ipcMain.handle('getVersionInfo', async () => { //TODO: Async and not consistent with other IPC handlers
  try {
      const packageJsonPath = path.join(__dirname, '../package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
      log.warn('main.js: Retrieved app version info: ' + packageJson.version);
      return {appVersion: packageJson.version};
  } catch (error) {
      console.error('Failed to retrieve version info:', error);
      return { appVersion: null, error: error.message };
  }
});

ipcMain.on('buttonPress', (event, data) => {
  log.warn('main.js:  Button press received with ID "' + data + '"');
  switch (data){
      case "btnOpenDashboard":      // Preferences dialog
        shell.openExternal('https://developer.spotify.com/dashboard/login');
        break;
      case "btnConnectToSpotify":   // Preferences dialog
        connectApi();
        break; 
      case "check_api_connection":  // Event raised by dynamic 'buttonCta' in notification window
        openPrefsWindow();
        break;
      case "authorise_dayjob":      // Event raised by dynamic 'buttonCta' in notification window
        log.warn('main.js:  Event authorise_dayjob received by main process.');
        authoriseDayjob();
        break;
      case "connect_api":           // Event raised by dynamic 'buttonCta' in notification window
        log.warn('main.js:  Event connect_api received by main process.');
        connectApi();
        break;
      case "playlist_settings":     // Event raised by dynamic 'buttonCta' in notification window
        log.warn('main.js:  Event playlist_settings received by main process.');
        openPrefsWindow();
        break;
  }
});

ipcMain.handle('getPref', async (event, pref) => {
  return prefsLocal.getPref(pref);
});

ipcMain.handle('setPref', async (event, pref, value) => {
  // TODO - The implementation in ui-preferences.js means a disk write occurs after every single keystroke - a delay should be imposed to save n seconds after the last change
  log.warn('main.js:  IPC is setting preference \'' + pref + '\' with value: ' + value)
  return prefsLocal.setPref(pref, value);
});

ipcMain.handle('setPlaylists', async (event, value) => {
  // TODO - The implementation in ui-preferences.js means a disk write occurs after every single keystroke - a delay should be imposed to save n seconds after the last change
  log.warn('main.js:  IPC has received an updated playlist JSON and is saving it.')
  playlists = value;
  return prefsLocal.setPref('dayjob_playlists_v1', value);
});

ipcMain.handle('logAndDisplayError', async (event, msg) => {
  log.warn('main.js:  IPC has received an error from the renderer and it will be reported to the user: ' + msg)
  logAndDisplayError(new Error(msg))
});

/**
 * -------------------------------------------------------------------------------------------------
 * Applicacation end
 * -------------------------------------------------------------------------------------------------
 */

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  log.warn('app:  window-all-closed event happened.');
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  log.warn('app:  will-quit event happened.');
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
})

