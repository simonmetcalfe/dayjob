/**
 * -------------------------------------------------------------------------------------------------
 * Name:         spotify-server.js
 * Description:  Module for establishing and mainting an API 
 *               connection to Spotify, using spotify-web-api-node.
 *               
 * Author:       Simon Metcalfe
 * -------------------------------------------------------------------------------------------------
 */

/**
 * -------------------------------------------------------------------------------------------------
 * Logging
 * -------------------------------------------------------------------------------------------------
 */

var log = require('electron-log');
log.warn('spotify-server.js:  Script has started.')

/**
 * -------------------------------------------------------------------------------------------------
 * Modules
 * -------------------------------------------------------------------------------------------------
 */

var SpotifyWebApi = require('spotify-web-api-node');
var http = require("http");
var url = require("url");
const prefsLocal = require('./prefs.js');
var events = require('events');

/**
 * -------------------------------------------------------------------------------------------------
 * Variables
 * -------------------------------------------------------------------------------------------------
 */

var spotifyApi; // Where we store the instance of spotifyApi
var webServer;
var authEvents; // Event emitter to let main process know when auth has taken place
var redirectUri = 'http://localhost:8888/callback';
var state; //For dayjob to verify requests to the redirect URI
var spotifyUserId;
var spotifyDisplayName;
var scopes = ['user-read-private', 
              'user-read-email', 
              'playlist-read-private', 
              'playlist-modify-private', 
              'playlist-read-collaborative', 
              'playlist-modify-public', 
              'user-read-recently-played', 
              'user-read-currently-playing',
              'user-modify-playback-state'];

/**
 * -------------------------------------------------------------------------------------------------
 * Variables external access
 * -------------------------------------------------------------------------------------------------
 */

module.exports.getSpotifyUserId = () => {return spotifyUserId;}
module.exports.getspotifyDisplayName = () => {return spotifyDisplayName;}
module.exports.getWebServer = () => {return webServer;}
module.exports.getAuthEvents = () => {return authEvents;}


/**
 * -------------------------------------------------------------------------------------------------
 * Helper functions
 * -------------------------------------------------------------------------------------------------
 */

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = (length) => {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};


/**
 * -------------------------------------------------------------------------------------------------
 * Auth events emitter (let the main process know when auth is complete)
 * -------------------------------------------------------------------------------------------------
 */

authEvents = new events.EventEmitter(); 

/**
 * -------------------------------------------------------------------------------------------------
 * Initialise web server (for receiving auth code in redirectURI)
 * -------------------------------------------------------------------------------------------------
 */

// Set a random state at startup to ensure webserver ignores requests without a 'state' query parameter 
state = generateRandomString(16);

module.exports.startWebServer = () => {
    return startWebServer()
}

function startWebServer(){ 
    webServer = http.createServer ( (request, response) => {
        log.warn('spotify-server.js:  Attempting to start the webserver.');
        // Get object with all the parameters
        var parsedUrl = url.parse(request.url, true); // true to get query as object
        var queryAsObject = parsedUrl.query;
        log.warn('spotify-server.js:  Web server has been accessed:')
        log.warn('                    - URL        : ' + request.url);
        log.warn('                    - Parameters : ' + JSON.stringify(queryAsObject));
        
        if (request.url == '/favicon.ico'){
            // Browser will always check for favicon which we want to ignore
            response.statusCode = 404;
        }
        else if (queryAsObject.code == undefined) {
            // Verify state and auth code
            response.writeHead(200, { "Content-Type": "text/plain" });
            response.write("Problem with redirect URL when authorising dayjob with Spotify.  No authorisation code was received in the URL.  Please try again.");
            log.warn('spotify-server.js: [ERROR] Problem with authorisation code received in the URL, code is ' + queryAsObject.code);
            authEvents.emit('auth_code_grant_error',err)
        }
        else if (queryAsObject.state != state) {
            response.writeHead(200, { "Content-Type": "text/plain" });
            response.write("Problem with redirect URL when authorising dayjob with Spotify.  State code missing or invalid.  Dayjob has ignored the authorisation request.  Please try again.");
            log.warn('spotify-server.js: [ERROR] Problem/mismatched state received in the URL, state is ' + queryAsObject.state);
            authEvents.emit('auth_code_grant_error',err)
        }
        else {
            response.writeHead(200, { "Content-Type": "text/plain" });
            response.write("dayjob has received an auth request.  Please close this web page and folow the prompts in the dayjob app.");
            log.warn('spotify-server.js:  Webserver received authorization code.  Will attempt to grant access with code...' + queryAsObject.code);
            prefsLocal.setPref('spotify-server_authorizationCode', queryAsObject.code);
            authCodeGrant()
                .then(result => {
                    authEvents.emit('auth_code_grant_success',result)
                }).catch(err => {
                    authEvents.emit('auth_code_grant_error',err)
                })
        }
        response.end();

    }).listen(8888, () => {
        log.warn('spotify-server.js:  Webserver initialised and listening for Spotify authentication requests.');
        authEvents.emit('ready');
        return 'ready';

    }).on('error', err => { 
        log.warn('main.js:  An error occurred with the spotify-server web server and it was stopped: ' + JSON.stringify(err))
        stopWebServer();
        if (err.code == 'EADDRINUSE'){
            authEvents.emit('webserver_port_in_use',err)    
        }
        else {
            authEvents.emit('webserver_general_error',err)
        }
    });
}




module.exports.checkIfWebServerReady = () => {
    return checkIfWebServerReady();
}

function checkIfWebServerReady() {
    return new Promise((resolve, reject) => {
        if (webServer.listening) {
            // If the server is already listening, resolve immediately
            resolve('Server is already running');
        }
        else {
            // Listen for the 'listening' event
        webServer.once('listening', () => {
            resolve('Server is up and running');
        });
        // Listen for errors to reject the promise
        webServer.once('error', (err) => {
            reject(`Failed to start server: ${err.message}`);
        });
        }
    });
}

module.exports.stopWebServer = () => {
    return stopWebServer();
}

function stopWebServer(){
    log.warn('spotify-server.js:  Attempting to stop the web server.');
    webServer
        .close() // Won't accept new connection
        .once('close', () => {
            log.warn('spotify-server.js:  The web server has stopped.')
            authEvents.emit('server_stopped');
            webServer = undefined
    });
}


/**
 * -------------------------------------------------------------------------------------------------
 * Initialise web API instance
 * -------------------------------------------------------------------------------------------------
 */

function initialiseSpotifyApiInstance(){
    // The instance must be recreated to set clientId and other parameters because 'spotifyApi.setClientId' does not seem to work work
    // Might be a bug in spotifyWebApi
    spotifyApi = new SpotifyWebApi({
        clientId: prefsLocal.getPref('spotify-server_clientId'),
        clientSecret: prefsLocal.getPref('spotify-server_clientSecret'),
        redirectUri: redirectUri,
        accessToken: prefsLocal.getPref('spotify-server_access_token'),
        refreshToken: prefsLocal.getPref('spotify-server_refresh_token')
    });
}

initialiseSpotifyApiInstance() // Must be done on startup

/**
 * -------------------------------------------------------------------------------------------------
 * Check API connection
 * -------------------------------------------------------------------------------------------------
 * Check the API connection each time before using it.  
 * Will reject promise if there is an error condition or accept if 
 * API 'appears' to be ready for use.
 * 
 */

module.exports.checkApiConnection = () => {
    return checkApiConnection();
};

function checkApiConnection() {
    log.warn('spotify-server.js:  Checking the state of the API connection...')
    return Promise.resolve().then(result => {
        // User-editable proeprties must be checked for being an empty string as well as undefined
        if (prefsLocal.getPref('spotify-server_clientId') == undefined || prefsLocal.getPref('spotify-server_clientId') == "") {
            // Spotify-client hasn't been provided ap ID/secret parameters 
            log.warn('spotify-server.js:  [ERROR] Cannot authenticate without a client ID.  Get user to create an register an application for API usage with Spotify, and provide the parameters.')
            return Promise.reject(new Error('no_client_id'));
        }
        else if (prefsLocal.getPref('spotify-server_clientSecret') == undefined || prefsLocal.getPref('spotify-server_clientSecret') == ""){
            // Spotify-client hasn't been provided ap ID/secret parameters 
            log.warn('spotify-server.js:  [ERROR] Cannot authenticate without a client secret.  Get user to create an register an application for API usage with Spotify, and provide the parameters.')
            return Promise.reject(new Error('no_client_secret'));
        }
        else if (prefsLocal.getPref('spotify-server_authorizationCode') == undefined || prefsLocal.getPref('spotify-server_access_token') == undefined) {
            // Not authorised in the past, authorise app and clear access tokens if any
            log.warn('spotify-server.js:  No authorisation code or access token, Spotify not authorised with API before, need to launch auth URL.')
            return Promise.reject(new Error('no_authorisation_code'));
        }
        else if (new Date().getTime() >= prefsLocal.getPref('spotify-server_token_expiration_date') - 10000) {
            // Token has expired, refresh it
            log.warn('spotify-server.js:  Current time ' + new Date().getTime() + ' exceeds token expiry ' + prefsLocal.getPref('spotify-server_token_expiration_date') + ' within 10000 ms, refreshing token...');
            return refreshAccessToken();
        } 
        else {
            log.warn('spotify-server.js:  Access token appears to be valid.');
            return 'ready';
        }
    }).then(result => {
        if (spotifyDisplayName == undefined || spotifyUserId == undefined) {
            // No Spotify user has been retrieved yet, get the user
            log.warn('spotify-server.js:  User ID and display name are not set, retrieving them now...');
            // Nested Promise to isolate errors from Spotify API and handle them
            return spotifyApi.getMe()
            .then(result => {
                // Log the result of .getMe and store the users name and ID 
                log.warn('spotify-server.js:  Retrieved user data JSON: ' + JSON.stringify(result.body) + '\n');
                spotifyDisplayName = result.body.display_name;
                spotifyUserId = result.body.id;
                return 'ready';
            }).catch(err => {
                // Handle spotifyApi.getMe promise error gracefully
                const handledErr = new Error("cannot_get_users_details")
                handledErr.error = err;
                return Promise.reject(handledErr);
            });
        } 
        else {
            log.warn('spotify-server.js:  Already have user ID and display name; no need to query API.');
            return 'ready';
        } 
    }).then(result => {   
        log.warn('spotify-server.js:  Spotify connected for user ' + spotifyDisplayName + ' (' + spotifyUserId + ')');    
        return 'ready';
    });
}

/**
 * -------------------------------------------------------------------------------------------------
 * Generate auth URL
 * -------------------------------------------------------------------------------------------------
 */

module.exports.getAuthUrl = () => {
    return Promise.resolve().then(result => {
        initialiseSpotifyApiInstance(); // Instance must be re-created to set the clientId
        spotifyApi.resetAccessToken();
        spotifyApi.resetRefreshToken();
        prefsLocal.deletePref('spotify-server_access_token');
        prefsLocal.deletePref('spotify-server_refresh_token');
        prefsLocal.deletePref('spotify-server_authorizationCode');
        prefsLocal.deletePref('spotify-server_token_expiration_date');
        spotifyDisplayName = undefined;
        spotifyUserId = undefined;
        // Generate random state ID for client to verify request
        state = generateRandomString(16);
        log.warn('spotify-server.js:  Generated random state ID for verifying requests to redirect URI: ' + state);
        // Create URL for authorising app and launch in user's browser
        var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)
        log.warn('spotify-server.js:  Generated Auth URL: ' + authorizeURL);
        return authorizeURL;
    }).catch(err => {
        log.warn('spotify-server.js:  [ERROR] Error creating auth URL.  Error ', err.message);
        // Handle spotifyApi.authorizationCodeGrant() and spotifyApi.getMe() promise errors gracefully
        const handledErr = new Error("error_creating_auth_url")
        handledErr.error = err;
        return Promise.reject(handledErr);
    });
}

/**
 * -------------------------------------------------------------------------------------------------
 * Grant auth
 * -------------------------------------------------------------------------------------------------
 * Triggered when the auth web server when callback URL is accessed
 */

function authCodeGrant() {
    // Clear tokens if retrying auth code grant
    return Promise.resolve().then(result => {
        spotifyApi.resetAccessToken();
        spotifyApi.resetRefreshToken();
        prefsLocal.deletePref('spotify-server_access_token');
        prefsLocal.deletePref('spotify-server_refresh_token');
        prefsLocal.deletePref('spotify-server_token_expiration_date');
        spotifyDisplayName = undefined;
        spotifyUserId = undefined;
        return spotifyApi.authorizationCodeGrant(prefsLocal.getPref('spotify-server_authorizationCode'))
    }).then(result => {
        log.warn('spotify-server.js:  Authorisation granted.');
        log.warn('spotify-server.js:  - Access token: ', result.body.access_token);
        log.warn('spotify-server.js:  - Access token expiry: ' + result.body.expires_in);
        log.warn('spotify-server.js:  - Refresh token: ' + result.body.refresh_token);
        // Save and set the access and refresh tokens
        prefsLocal.setPref('spotify-server_access_token', result.body.access_token);
        prefsLocal.setPref('spotify-server_refresh_token', result.body.refresh_token);
        spotifyApi.setAccessToken(result.body.access_token);
        spotifyApi.setRefreshToken(result.body.refresh_token);
        // Calculate date of access token expiry in ms
        prefsLocal.setPref('spotify-server_token_expiration_date', new Date().getTime() + result.body.expires_in * 1000); //Convert seconds to ms
        log.warn('spotify-server.js:  Token expiration date set (ms):  ' + prefsLocal.getPref('spotify-server_token_expiration_date'));
        return spotifyApi.getMe();
        // TODO - is it necessary to call spotifyApi.getMe() just to log the users details - either it is not, or the users details should be saved to a variable instead
    }).then(result => {
        // Success
        log.warn('spotify-server.js:  Connected successfully.  Retrieved data for ' + result.body.display_name);
        log.warn('spotify-server.js:    Email: ' + result.body.email);
        log.warn('spotify-server.js:    Account type: ' + result.body.product);
        //log.warn('spotify-server.js:    Image URL: ' + result.body.images[0].url);
        return result; // TODO - Should this return a custom message, e.g. 'authorisation_granted'?
    }).catch(err => {
        log.warn('spotify-server.js:  [ERROR] Exception after authorision was not successfully granted.  Try revoking access to the application in the Apps section of your Spotify account, and re-authenticating.  Error ', err.message);
        // Handle spotifyApi.authorizationCodeGrant() and spotifyApi.getMe() promise errors gracefully
        const handledErr = new Error("error_authorising")
        handledErr.error = err;
        return Promise.reject(handledErr);
    });
}


/**
 * -------------------------------------------------------------------------------------------------
 * Refresh access tokens
 * -------------------------------------------------------------------------------------------------
 */

function refreshAccessToken() {
    return spotifyApi.refreshAccessToken()
        .then(result => {
            log.warn('spotify-server.js:  The access token has been refreshed: ' + result.body.access_token);
            // Save the access token so that it's used in future calls (setAccessToken does not return a Promise)
            spotifyApi.setAccessToken(result.body.access_token);
            prefsLocal.setPref('spotify-server_access_token', result.body.access_token);
            // Calculate date of access token expiry in ms
            prefsLocal.setPref('spotify-server_token_expiration_date', new Date().getTime() + (result.body.expires_in * 1000)); //Convert seconds to ms
            log.warn('spotify-server.js:  The access token expiration date refreshed (ms):  ' + new Date().getTime() + " / " + prefsLocal.getPref('spotify-server_token_expiration_date'));
            return 'access_token_refreshed';
        }).catch(err => { 
            log.warn('spotify-server.js:  [ERROR] Could not refresh access token.  It is possible the user revoked access to dayjob.  Clearing auth data and re-launching auth URL.  Error ' + err.message);
            // Handle spotifyApi.refreshAccessToken promise error gracefully
            const handledErr = new Error("cannot_refresh_access_token")
            handledErr.error = err;
            return Promise.reject(handledErr);
        });
}

/**
 * -------------------------------------------------------------------------------------------------
 * API calls 
 * -------------------------------------------------------------------------------------------------
 */

/**
 * Get the current playling track
 * -------------------------------------------------------------------------------------------------
 */

function getMyCurrentPlayingTrack() {
    // Directly exports the result of the spotify-web-api-node function
    return spotifyApi.getMyCurrentPlayingTrack()
        .then(result => {
            return result;
        }).catch(err => { 
            // Handle external promise error gracefully
            const handledErr = new Error("cannot_get_playing_track_info")
            handledErr.error = err;
            return Promise.reject(handledErr);
        })
}

/**
 * Add tracks to playlist
 * -------------------------------------------------------------------------------------------------
 */

module.exports.addTracksToPlaylist = (playlistId, tracks) => {
    return addTracksToPlaylist(playlistId, tracks)
}

function addTracksToPlaylist(playlistId, tracks){
    // Needs playlistId, tracks
    // Example '3EsfV6XzCHU8SPNdbnFogK','["spotify:track:4iV5W9uYEdYUVa79Axb7Rh", "spotify:track:1301WleyT98MSxVHPZCA6M"]'
    return spotifyApi.addTracksToPlaylist(playlistId, tracks)
        .then(result => {
            return result;
        }).catch(err => {          
            // Handle external promise error gracefully
            const handledErr = new Error("cannot_add_track_to_playlist")
            handledErr.error = err;
            return Promise.reject(handledErr);
        });
}

/**
 * Remove track from playlist
 * -------------------------------------------------------------------------------------------------
 */

module.exports.removeTracksFromPlaylist = (playlistId, tracks) => {
    return removeTracksFromPlaylist (playlistId, tracks) 
}

function removeTracksFromPlaylist (playlistId, tracks) {
    // Needs playlistId, tracks, options, callback
    return spotifyApi.removeTracksFromPlaylist(playlistId, tracks)
        .catch(err => {  
            // Handle external promise error gracefully
            const handledErr = new Error("cannot_remove_track_from_playlist")
            handledErr.error = err;
            return Promise.reject(handledErr);
        });
}

/**
 * Get playlist
 * -------------------------------------------------------------------------------------------------
 */

function getPlaylist(playlistId) {
    // Directly exports the result of the spotify-web-api-node function
    return spotifyApi.getPlaylist(playlistId)
        .then(result => {
            log.warn('spotify-server.js:  Get playlist \'' + playlistId + ', JSON: ' + JSON.stringify(result) + "\n");
            return result;
        }).catch(err => { 
            // Handle external promise error gracefully
            const handledErr = new Error("cannot_get_playlist_info")
            handledErr.error = err;
            return Promise.reject(handledErr);
        });
}

/**
 * Get playlist name
 * -------------------------------------------------------------------------------------------------
 */

module.exports.getPlaylistName = (playlistId) => {
    return getPlaylistName(playlistId);
}

function getPlaylistName(playlistId){
    return getPlaylist(playlistId)
    .then(result => {
        log.warn('spotify-server.js:  Retrieved playlist name \'' + result.body.name + '\' for playlist \'' + playlistId + '\'');
        return result.body.name;
    });
}

/**
 * Skip track
 * -------------------------------------------------------------------------------------------------
 */

module.exports.skipToNext = () => {
    return skipToNext();
}
function skipToNext(){
    return spotifyApi.skipToNext()
        .then(result => {
            log.warn('spotify-server.js: Skipping track using Spotify API successful: ' + result);
            return result;
        }).catch(err => { 
            log.warn('spotify-server.js: Skipping track using Spotify API failed, but allowed to fail silently: ' + err);
            // Always returns a resolved promise even on failure, just logs failure silently
            return null;
        });
}

/**
 * Parse playing track info
 * -------------------------------------------------------------------------------------------------
 */
// This is in a separate function so that we can capture any errors that occur
// Returns a JSON object 'trackinfo'

function parsePlayingTrackInfo(playingTrackJson){ //TODO:  Come back to this one
    trackInfo = {
        context:{}
    }
    return Promise.resolve().then(result => {
        // Detect unsupported responses and reject
        if (playingTrackJson.statusCode == 204){return Promise.reject(new Error("track_not_playing"))}  // No music is playing
        else if (playingTrackJson.body.currently_playing_type == "episode"){return Promise.reject(new Error("track_is_podcast"))}  // We can't process podcasts at all so just abort 
        else {return 'ready'};
    }).then(result => { 
        // This Promise is nested so we can catch its own error
        return Promise.resolve().then(result => {
            //Write basic track info
            trackInfo.uri = playingTrackJson.body.item.uri;
            trackInfo.name = playingTrackJson.body.item.name;
            trackInfo.artistName = playingTrackJson.body.item.artists[0].name;
            trackInfo.albumName = playingTrackJson.body.item.album.name;
            trackInfo.fullJson = playingTrackJson
            // Set context defaults
            trackInfo.context.name = null;
            trackInfo.context.readOnly = true;
            trackInfo.context.sourcePlaylistId = null;
            trackInfo.context.sourcePlaylistName = null;
            trackInfo.context.sourcePlaylistOwner = null;
            // Get playlist info (needed to determine context as playing from mid-2021 Spotify client no longer gives the user ID in the URI when calling getMyCurrentPlayingTrack)
            if (playingTrackJson.body.context != null && playingTrackJson.body.context.type == "playlist"){
                if (playingTrackJson.body.context.uri.split(':').length == 5) {
                    // Legacy client playing music with URI in format spotify:user:g0rak:playlist:1U9jrEDaH36sapAbJf21N2 
                    log.warn('spotify-server.js:  LEGACY Spotify client detected with old URI format.');
                    trackInfo.context.sourcePlaylistId = playingTrackJson.body.context.uri.split(':')[4];
                } else if (playingTrackJson.body.context != null && playingTrackJson.body.context.type == "playlist" && playingTrackJson.body.context.uri.split(':').length == 3) {
                    // New client with URI in format spotify:playlist:1U9jrEDaH36sapAbJf21N2
                    trackInfo.context.sourcePlaylistId = playingTrackJson.body.context.uri.split(':')[2];
                }
                log.warn('spotify-server.js:  Getting playlist name for playlist ID... ' + trackInfo.context.sourcePlaylistId);
                return getPlaylist(trackInfo.context.sourcePlaylistId);
            } else {
                return 'ready';  
            }
        }).then(result => { 
            // Determine context
            if      (playingTrackJson.body.item.is_local)               {trackInfo.context.name = "Local file" }  
            else if (playingTrackJson.body.context == null)             {trackInfo.context.name = "Liked or Recommended" }         
            else if (playingTrackJson.body.context.type == "artist")    {trackInfo.context.name = "Artist"}                       
            else if (playingTrackJson.body.context.type == "album")     {trackInfo.context.name = "Album"}             
            else if (playingTrackJson.body.context.type == "playlist"){ 
                trackInfo.context.sourcePlaylistName = result.body.name; // Utilise the info from getPlaylist
                trackInfo.context.sourcePlaylistOwner = result.body.owner.id;
                if (trackInfo.context.sourcePlaylistOwner == spotifyUserId){
                    trackInfo.context.readOnly=false;
                    trackInfo.context.name = "Playlist"
                } else if (trackInfo.context.sourcePlaylistOwner == 'spotify'){
                    trackInfo.context.name = "Radio"; // When played from radio thumbnail
                } else {
                    trackInfo.context.name = "Shared playlist / Radio"; // Assume any other type of playist is non-user or radio
                }
            } else {
                trackInfo.context.name = "Unknown source";
            }
            return 'ready';
        }).catch(err => {
            // Catch any errors we might have parsing the JSON
            const handledErr = new Error("error_parsing_playing_track_json")
            handledErr.error = err;
            return Promise.reject(handledErr);
        })
    }).then(result => {
        return trackInfo;
    })
}

/**
 * Get playing track info
 * -------------------------------------------------------------------------------------------------
 * Get basic track info from JSON response
 * Identify the source of the playling track using logic, and if 
 * it is read only 
 * Lookup name of playlist if possible (2nd API call)
 * 
 */

module.exports.getPlayingTrackInfo = () => {
    return getPlayingTrackInfo();
}

function getPlayingTrackInfo(){ 
    return checkApiConnection()
        .then(result => {
            log.warn('spotify-server.js:  Check API connection succeeded, now getting currently playing track info...');
            return getMyCurrentPlayingTrack()
        }).then(result => {
            log.warn('spotify-server.js:  Got current track JSON: ' + JSON.stringify(result) + "\n");
            return parsePlayingTrackInfo(result)
        }); //TODO: Add error handling
}

/**
 * Remove playing track from its playlist 
 * -------------------------------------------------------------------------------------------------
 */

module.exports.removePlayingTrackFromPlaylist = () => {
    return removePlayingTrackFromPlaylist()
}

function removePlayingTrackFromPlaylist(){
    trackInfo = {};
    return getPlayingTrackInfo()
        .then(result => {
            trackInfo = result;
            if (trackInfo.context.readOnly == true){
                // Can't modify the playlist so throw an error
                const handledErr = new Error("playlist_is_read_only")
                handledErr.error = trackInfo.context.name;
                return Promise.reject(handledErr) //TODO - Does not communicate playlist name, may need to improve this, maybe don't throw an error
            }
            else {
                log.warn('spotify-server.js:  Attempting to remove track ' + trackInfo.name + ' (' + trackInfo.uri + ') from ' + trackInfo.context.sourcePlaylistName + " (" + trackInfo.context.sourcePlaylistId + ')');
                return removeTracksFromPlaylist(trackInfo.context.sourcePlaylistId, [{ uri: trackInfo.uri }])  
            }
        }).then(result => {    
            log.warn('spotify-server.js:  Removed track from ' + trackInfo.context.sourcePlaylistName + ' (' + trackInfo.context.sourcePlaylistId + ')\n' +
                                            'Name   : ' + trackInfo.name + ' (' + trackInfo.uri + ')\n' + 
                                            'Artist : ' + trackInfo.artistName + '\n' + 
                                            'Album  : ' + trackInfo.albumName + '\n')
            trackInfo.result = result
            return trackInfo;
        });
}

/**
 * Copy OR Move playing track to specified playlist based on parameter
 * -------------------------------------------------------------------------------------------------
 */

module.exports.copyOrMovePlayingTrackToPlaylist = (destPlaylistId, destPlaylistName, move) => {
    if (move == 0) {return copyPlayingTrackToPlaylist(destPlaylistId, destPlaylistName);}
    if (move == 1) {return movePlayingTrackToPlaylist(destPlaylistId, destPlaylistName);}
}

/**
 * Copy playing track to specified playlist 
 * -------------------------------------------------------------------------------------------------
 */

module.exports.copyPlayingTrackToPlaylist = (destPlaylistId, destPlaylistName) => {
    return copyPlayingTrackToPlaylist(destPlaylistId, destPlaylistName);
}

function copyPlayingTrackToPlaylist(destPlaylistId, destPlaylistName){
    trackInfo = {};
    return getPlayingTrackInfo()
        .then(result => {
            trackInfo = result;
            trackInfo.destPlaylistId = destPlaylistId;
            trackInfo.destPlaylistName = destPlaylistName;
            log.warn('spotify-server.js:  Attempting to add track ' + trackInfo.name + ' (' + trackInfo.uri + ') to ' + trackInfo.destPlaylistName + ' (' + trackInfo.destPlaylistId + ')');
            return addTracksToPlaylist(trackInfo.destPlaylistId, [trackInfo.uri])
        }).then(result => {    
            log.warn('spotify-server.js:  Added track to ' + trackInfo.destPlaylistName + ' (' + trackInfo.destPlaylistId + ')\n' +
                                            'Name   : ' + trackInfo.name + ' (' + trackInfo.uri + ')\n' + 
                                            'Artist : ' + trackInfo.artistName + '\n' + 
                                            'Album  : ' + trackInfo.albumName + '\n')
            trackInfo.result = result;
            return trackInfo;
        });
}

/**
 * Move playing track from current playlist to specified playlist 
 * -------------------------------------------------------------------------------------------------
 */

module.exports.movePlayingTrackToPlaylist = (destPlaylistId, destPlaylistName) => {
    return movePlayingTrackToPlaylist(destPlaylistId, destPlaylistName);
}

function movePlayingTrackToPlaylist(destPlaylistId, destPlaylistName){
    trackInfo = {};
    return getPlayingTrackInfo()
        .then(result => {
            trackInfo = result;
            trackInfo.destPlaylistId = destPlaylistId;
            trackInfo.destPlaylistName = destPlaylistName;
            log.warn('spotify-server.js:  Attempting to add track (move step 1 of 2) ' + trackInfo.name + ' (' + trackInfo.uri + ') to ' + trackInfo.destPlaylistName + ' (' + trackInfo.destPlaylistId + ')');
            return addTracksToPlaylist(trackInfo.destPlaylistId, [trackInfo.uri]);
        }).then(result => {    
            log.warn('spotify-server.js:  Added track to ' + trackInfo.destPlaylistName + ' (' + trackInfo.destPlaylistId + ')\n' +
                                            'Name   : ' + trackInfo.name + ' (' + trackInfo.uri + ')\n' + 
                                            'Artist : ' + trackInfo.artistName + '\n' + 
                                            'Album  : ' + trackInfo.albumName + '\n')
            if (trackInfo.context.readOnly == true){
                trackInfo.result = 'copied_and_not_moved'
                return trackInfo;
            } else {
                log.warn('spotify-server.js:  Attempting to remove track (move step 2 of 2) ' + trackInfo.name + ' (' + trackInfo.uri + ') from ' + trackInfo.context.sourcePlaylistName + " (" + trackInfo.context.sourcePlaylistId + ')');
                return removeTracksFromPlaylist(trackInfo.context.sourcePlaylistId, [{ uri: trackInfo.uri }]);
            }
        }).then(result => {    
            if (trackInfo.result == 'copied_and_not_moved'){
                return trackInfo;
            }
            else {
                log.warn('spotify-server.js:  Removed track from ' + trackInfo.context.sourcePlaylistName + ' (' + trackInfo.context.sourcePlaylistId + ')\n' +
                'Name   : ' + trackInfo.name + ' (' + trackInfo.uri + ')\n' + 
                'Artist : ' + trackInfo.artistName + '\n' + 
                'Album  : ' + trackInfo.albumName + '\n')
                trackInfo.result = result
                return trackInfo;
            }
        });
}


/**
 * -------------------------------------------------------------------------------------------------
 * Spotify helper functions
 * -------------------------------------------------------------------------------------------------
 */

module.exports.getPlaylistIdFromUriOrUrl = (value) => {
    return getPlaylistIdFromUriOrUrl(value);
}

function getPlaylistIdFromUriOrUrl(value){
    var playlistId = '';
    if (value.includes('spotify:playlist:')){
        // Playlist URI format (no longer supported on new clients): spotify:playlist:7wc5E787OhRM7eYwPQ1jia 
        playlistId = value.split(':')[2];
    } else if (value.includes('open.spotify.com/user/') || value.includes('open.spotify.com/playlist/')){
        // Old playlist URL format: https://open.spotify.com/user/g0rak/playlist/2E6HFwtDrcilU3tulHIvEB?si=pDgElZD1T_OJhpSXu33gvg
        // New playlist URL format: https://open.spotify.com/playlist/2E6HFwtDrcilU3tulHIvEB?si=a77d9b726ebc418a
        playlistId = value.split('/')[value.split('/').length - 1].split('?')[0];
    } else {
        // TODO: Need some proper error handling!
    }
    log.warn('spotify-server.js:  playlist ID ' + playlistId + ' retrieved from URI/URL ' + value);
    return playlistId;
}
