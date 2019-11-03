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
////  Load saved playlist array
///////////////////////////////////////////////////////////////////

// Playlist storage
var playlists = [];

// v1 playlist storage is an 11 object multimensional array (0 to 10), representing the keyboard keys `1234567890 in order
// Each array item contains an array with (keyboard_key,playlist_uri,playlist_name,boolean_move_track) 

if (prefsLocal.getPref('dayjob_playlists_v1') == undefined){
  // No playlists stored, create a blank array
  playlists = new Array(new Array('`','test','',0),
                        new Array('1','test','',0),
                        new Array('2','','',0),
                        new Array('3','','',0),
                        new Array('4','','',0),
                        new Array('5','','',0),
                        new Array('6','','',0),
                        new Array('7','','',0),
                        new Array('8','','',0),
                        new Array('9','','',0),
                        new Array('0','','',0));
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

  // Register shortcuts


  const sct6 = globalShortcut.register('Control+Alt+6', () => {
    log.warn('main.js:  Control+Alt+6 is pressed');
    spotifyServer.skipToNext()
    .then(function (result) {
      return spotifyServer.getPlayingTrackInfo()
    }).then(function (result) {
      log.warn('out: '+ JSON.stringify(result));
    }, function (err) {
      log.warn('main.js: Error when talking to Spotify API (6).  Error ' + err);
      showNotification('Error when talking to Spotify API', err.message, '', '');
    }).catch(function (err) {
      log.warn('main.js:  Exception when talking to Spotify API (6).  Error ' + err);
      showNotification('Exception when talking to Spotify API', err.message, '', '');
    })
  });

  if (!sct6) {
    log.warn('main.js:  registration failed of:  Control+Alt+6')
  };


  const sct7 = globalShortcut.register('Control+Alt+7', () => {
    log.warn('main.js:  Control+Alt+7 is pressed');
  });

  if (!sct7) {
    log.warn('main.js:  registration failed of:  Control+Alt+7')
  };

  const sctRemoveTrack = globalShortcut.register('Control+Alt+-', () => {
    log.warn('main.js:  Control+Alt+- is pressed');
    spotifyServer.removePlayingTrackFromPlaylist()
    .then(function (result) {
      // We're done, skip song, log and show notification
      log.warn('main.js:  Removed track ' + result.name + ', ' + result.albumName + ', ' + result.artistName + ', ' + result.uri + ' from ' + result.context.sourcePlaylistName + " , " + result.context.sourcePlaylistId + ' : ' + result.result);
      showNotification('Removed track ' + result.name + ' from ' + result.context.sourcePlaylistName, '', '', '');
      return spotifyServer.skipToNext(); 
    }).then(function (result) {  
      // No action required    
    }, function (err) {
      log.warn('main.js: Error when talking to Spotify API (-).  Error ' + err);
      console.log("msg " + err.message)
      console.log("code " + err.code)
      console.log("error " + err.error)
      console.log("stack " + err.stack)
      console.log("obj " + err)
      showNotification('Error when talking to Spotify API', err.message, '', '');
    }).catch(function (err) {
      log.warn('main.js:  Exception when talking to Spotify API (-).  Error ' + err);
      showNotification('Exception when talking to Spotify API', err.message, '', '');
    })
  });

  if (!sctRemoveTrack) {
    log.warn('main.js:  registration failed of:  Control+Alt+-')
  };

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

  if (!sctAddTrack) {
    log.warn('main.js:  registration failed of:  Control+Alt+=')
  };

  const sctNewBands = globalShortcut.register('Control+Alt+`', () => {
    log.warn('main.js:  Control+Alt+` is pressed');
    // Add the current track to DayJobNewBands and remove it from the source playlist
    //spotifyServer.movePlayingTrackToPlaylist('5RSreRiji8KaKNBqStRbJm','DayJobNewBands')
  });

  if (!sctNewBands) {
    log.warn('main.js:  registration failed of:  Control+Alt+`')
  };

  const sctAddToDump = globalShortcut.register('Control+Alt+0', () => {
    log.warn('main.js:  Control+Alt+0 is pressed');

    // Add the current track to _DUMP and remove it from the source playlist
    //spotifyServer.movePlayingTrackToPlaylist('1lkqDHoGm03GXS63tkkmyi','_DUMP')
  });

  if (!sctAddToDump) {
    log.warn('main.js:  registration failed of:  Control+Alt+`')
  };

 

  /*
  }).then(function(result){
  // Get the user's playlists (because we need playlist owner IDs)
  return spotifyServer.getUserPlaylists()
  }).then(function (result) {
  serverUserPlaylistsJson = result;
  log.warn('main.js:  Got : getUserPlaylists' + JSON.stringify(serverUserPlaylistsJson));
  */
  const sctTest1 = globalShortcut.register('Control+Alt+1', () => {
    var clientJson;
    var serverCurrentPlayingTrackJson;
    var playingTrackUri;
    var sourcePlaylistId;
    var sourcePlaylistName;

    // This is a test function to check if a song exists in a playlist already
    spotifyServer.checkApiConnection()
      .then(function (result) {
        log.warn('main.js:  Getting Spotify client JSON');
        return spotifyClient.getTrackInfo()
      }).then(function (result) {
        clientJson = result;
        log.warn('main.js:  Got clientJson: ' + JSON.stringify(clientJson));
        playingTrackUri = clientJson.track.track_resource.uri;
        log.warn('main.js:  playingTrackUri is ' + playingTrackUri);
      }).then(function (result) {
        //Now get track info with playlist
        // THIS FUNCTION HAS BEEN REMOVED, IT IS NOW INTERNAL ONLY
        return spotifyServer.getMyCurrentPlayingTrack()
      }).then(function (result) {
        serverCurrentPlayingTrackJson = result;
        sourcePlaylistId = serverCurrentPlayingTrackJson.body.context.uri.split(':')[4]
        log.warn('main.js:  Got serverCurrentPlayingTrackJson: ' + JSON.stringify(serverCurrentPlayingTrackJson));
        log.warn('sourcePlaylistId is ' + sourcePlaylistId);
      }).then(function (result) {
        // Now get the playlist details
        log.warn('Getting playlist info for playlist ID ' + sourcePlaylistId)
        // THIS FUNCTION HAS BEEN REMOVED
        return spotifyServer.getPlaylistName(sourcePlaylistId);
      }).then(function (result) {
        sourcePlaylistName = result;
        log.warn('main.js:  Got sourcePlaylistName: ' + sourcePlaylistName);
        showNotification('Got information', 'Source playlist:' + sourcePlaylistName, '', '');
      }).then(function (result) {
        return spotifyServer.ifSongExistsInPlaylist(playingTrackUri, sourcePlaylistId);
      }).then(function (result) {
        log.warn('main.js:  Got ifSongExistsInPlaylist result: ' + result);
      }, function (err) {
        log.warn('main.js: Error when talking to Spotify API.  Error ' + err);
        showNotification('Error when talking to Spotify API', err.message, '', '');
      }).catch(function (err) {
        log.warn('main.js:  Exception when talking to Spotify API.  Error ' + err);
        showNotification('Exception when talking to Spotify API', err.message, '', '');
      })
  });

  if (!sctTest1) {
    log.warn('main.js:  registration failed of:  Control+Alt+1')
  };

  

  // Check whether a shortcut is registered.
  //log.warn(globalShortcut.isRegistered('CommandOrControl+X'))
});



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

