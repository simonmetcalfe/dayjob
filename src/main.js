///////////////////////////////////////////////////////////////////
//// Modules
///////////////////////////////////////////////////////////////////

// Type 'npm install DependencyName' on command prompt to install
// require('log-timestamp');
const electron = require('electron');
var shell = require('electron').shell;
const { app, globalShortcut, ipcMain } = require('electron');  //globalShortcut must be defined with app or it does not work
const menubar = require('menubar');
const spotifyServer = require('./spotify-server.js');
const prefsLocal = require('./prefs.js');

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
log.warn('main.js:  __dirname path is reported as: ' + __dirname);
log.warn('main.js:  app.getAppPath path is reported as: ' + app.getAppPath());


///////////////////////////////////////////////////////////////////
////  Load application defaults
///////////////////////////////////////////////////////////////////

// Any variables that should have a default should be specified here

if (prefsLocal.getPref('dayjob_always_move_tracks') == undefined){prefsLocal.setPref('dayjob_always_move_tracks',0)}

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
      "`" : {playlistID: "", playlistName:""},
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

const mb = menubar();

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
  mainWindow = new BrowserWindow({ maxWidth: 400, maxHeight: 200, show: false });

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
  aboutWindow = new BrowserWindow({ width: 400, height: 350, maxWidth: 400, maxHeight: 350, show: false });

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
      showNotification('Connected to Spotify as ' + spotifyServer.getspotifyDisplayName(), '', '', '');
    }, function (err) {
      if (err.message == 'no_client_id') {
        log.warn('main.js:  Can\'t connect to Spotify without a client ID and Secret!')
        showNotification('Can\'t connect to Spotify without a client ID and Secret!', '', '', '');
      }
      if (err.message == 'no_authorisation_code') {
        spotifyServer.getAuthUrl()
          .then(function (result) {
            log.warn('main.js:  Requested user auth dayjob with Spotify using URL: ' + result);
            showNotification('dayjob needs authorising with Spotify', result, '', '');
          }, function (err) {
            // TODO - review these because getAuthUrl Promise will never return a failure
            log.warn('main.js:  Error getting authorisation URL');
            showNotification('Error getting authorisation URL: ' + err, '', '', '');
          }).catch(function (err) {
            log.warn('main.js:  Exception getting authorisation URL: ' + err);
            showNotification('Exception getting authorisation URL: ' + err, '', '', '');
          })
      }
      else {
        log.warn('main.js:  Unknown error checking API: ' + err);
        showNotification('Unknown error checking API: ' + err, '', '', '');
      }
    }).catch(function (err) {
      showNotification('Exception when connecting to Spotify: ' + err);
    });
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
  const ctrlAltApostrophe = globalShortcut.register('Control+Alt+`', () => {keyPressed({modifiers: ["Control","Alt"],key: "`"})});
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
  const ctrlAltShfApostrophe = globalShortcut.register('Control+Alt+Shift+`', () => {keyPressed({modifiers: ["Control","Alt","Shift"],key: "`"})});
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
  if (!ctrlAltApostrophe) {log.warn('main.js:  registration failed of: ctrlAltApostrophe (Control+Alt+`)')};
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
  if (!ctrlAltShfApostrophe) {log.warn('main.js:  registration failed of: ctrlAltApostrophe (Control+Alt+Shift+`)')};
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
    log.warn('main.js:  Remove track keyboard shortcut pressed...');
    spotifyServer.removePlayingTrackFromPlaylist()
      .then(function (result) {
        // We're done, skip song, log and show notification
        log.warn('main.js:  Removed track ' + result.name + ', ' + result.albumName + ', ' + result.artistName + ', ' + result.uri + ' from ' + result.context.sourcePlaylistName + " , " + result.context.sourcePlaylistId + ' : ' + result.result);
        showNotification('Removed track ' + result.name + ' from ' + result.context.sourcePlaylistName, '', '', '');
        return spotifyServer.skipToNext(); 
      }).then(function (result) {  
        // No action required    
      }, function (err) {
        log.warn('main.js: Error when talking to Spotify API (-). ' + err.stack);
        if (err.hasOwnProperty("error")){log.warn('main.js: Original error stack: ' + err.error.stack)}
        showNotification('Error when talking to Spotify API', err.message, '', '');
      }).catch(function (err) {
        log.warn('main.js:  Exception when talking to Spotify API (-).  Error ' + err);
        showNotification('Exception when talking to Spotify API', err.message, '', '');
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
  
  if (key.modifiers.includes('Control') && key.modifiers.includes('Alt') && ['`','1','2','3','4','5','6','7','8','9','0'].includes(key.key)){
    var move = 0;
    // Determine if track should be moved
    if (prefsLocal.getPref('dayjob_always_move_tracks') == 0 && key.modifiers.includes('Shift')) {move = 1} 
    if (prefsLocal.getPref('dayjob_always_move_tracks') == 1 && !key.modifiers.includes('Shift')){move = 1}
    log.warn('main.js:  Add/move track to playlist in slot shortcut pressed:  Slot: ' + key.key + ' Move: ' + move);
    // Add the current track to DayJobTest and remove it from the source playlist
    spotifyServer.copyOrMovePlayingTrackToPlaylist(playlists[key.key].playlistID,playlists[key.key].playlistID, move)
    .then(function (result) {
      // We're done, skip song, log and show notification
      log.warn('main.js:  Added track ' + result.name + ', ' + result.albumName + ', ' + result.artistName + ', ' + result.uri + ' to ' + result.destPlaylistName + " , " + result.destPlaylistId + ' : ' + result.result);
      log.warn('main.js:  Removed track ' + result.name + ', ' + result.albumName + ', ' + result.artistName + ', ' + result.uri + ' from ' + result.context.sourcePlaylistName + " , " + result.context.sourcePlaylistId);
      showNotification('Added track ' + result.name + ' to ' + result.context.destPlaylistName + ' (removed from ' + result.context.sourcePlaylistName + ')', '', '', '');
    }, function (err) {
      log.warn('main.js: Error when talking to Spotify API (+).  Error ' + err);
      showNotification('Error when talking to Spotify API', err.message, '', '');
    }).catch(function (err) {
      log.warn('main.js:  Exception when talking to Spotify API (+).  Error ' + err);
      showNotification('Exception when talking to Spotify API', err.message, '', '');
    })
    }

////////


const sctAddTrack = globalShortcut.register('Control+Alt+=', () => {
  log.warn('main.js:  Control+Alt+= is pressed');
  // Add the current track to DayJobTest and remove it from the source playlist
  spotifyServer.movePlayingTrackToPlaylist('4SAk2gITCgpbAKkZOnVNZY','DayJobTest')
  .then(function (result) {
    // We're done, skip song, log and show notification
    log.warn('main.js:  Added track ' + result.name + ', ' + result.albumName + ', ' + result.artistName + ', ' + result.uri + ' to ' + result.destPlaylistName + " , " + result.destPlaylistId + ' : ' + result.result);
    log.warn('main.js:  Removed track ' + result.name + ', ' + result.albumName + ', ' + result.artistName + ', ' + result.uri + ' from ' + result.context.sourcePlaylistName + " , " + result.context.sourcePlaylistId);
    showNotification('Removed track ' + result.name + ' from ' + result.context.sourcePlaylistName, '', '', '');
  }, function (err) {
    log.warn('main.js: Error when talking to Spotify API (+).  Error ' + err);
    showNotification('Error when talking to Spotify API', err.message, '', '');
  }).catch(function (err) {
    log.warn('main.js:  Exception when talking to Spotify API (+).  Error ' + err);
    showNotification('Exception when talking to Spotify API', err.message, '', '');
  })     
});







////////



  if (key.modifiers.includes('Control') && key.modifiers.includes('Alt') && key.modifiers.includes('Shift')){
    // Code for when shift keyu is held
    log.warn('Shift modifer in operation')
  }

}

function showNotification(title, line1, line2, line3) {
  // A generic function to show the notification window...
  mb.window.webContents.send('setNotificationText', title)
  mb.window.webContents.send('setTrackName', line1);
  mb.window.webContents.send('setTrackArtist', line2);
  mb.window.webContents.send('setTrackAlbum', line3);
  //mb.showWindow();
  mb.window.showInactive();
  // When a notification occurs, close the window briefly after
  function doAfterDelay() { mb.hideWindow(); }
  setTimeout(doAfterDelay, 5000);
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

ipcMain.on('btnOpenNewWindow', function (event) {
  log.warn('main.js:  Event btnOpenNewWindow received by main process.');
});

ipcMain.on('btnOpenDashboard', function (event) {
  log.warn('main.js:  Event btnOpenDashboard received by main process.');
  shell.openExternal('https://developer.spotify.com/dashboard/login');
});

ipcMain.on('btnConnectToSpotify', function (event) {
  log.warn('main.js:  Event btnConnectToSpotify received by main process.');
  connectApi();
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

