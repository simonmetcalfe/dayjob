///////////////////////////////////////////////////////////////////
//// Name:         spotify-server.js
//// Description:  Module for establishing and mainting an API 
////               connection to Spotify, using spotify-web-api-node.
////               
//// Version:      0.0.1
//// Author:       Simon Metcalfe
///////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////
//// Modules
///////////////////////////////////////////////////////////////////

var SpotifyWebApi = require('spotify-web-api-node');
var http = require("http");
var url = require("url");
const prefsLocal = require('./prefs.js');
var log = require('electron-log');

//let _this; // For calling exported modules within this js file


///////////////////////////////////////////////////////////////////
//// Variables
///////////////////////////////////////////////////////////////////

var scopes = ['user-read-private', 'user-read-email', 'playlist-read-private', 'playlist-modify-private', 'playlist-read-collaborative', 'playlist-modify-public', 'user-read-recently-played', 'user-read-currently-playing','user-modify-playback-state'];
var redirectUri = 'http://localhost:8888/callback';
var tokenExpirationEpoch;
var state; //For dayjob to verify requests to the redirect URI


///////////////////////////////////////////////////////////////////
//// Initialise web server (for receiving auth code in redirectURI)
///////////////////////////////////////////////////////////////////

http.createServer(function (request, response) {
    // Get object with all the parameters
    var parsedUrl = url.parse(request.url, true); // true to get query as object
    var queryAsObject = parsedUrl.query;
    log.warn('spotify-server.js:  Web server has been accessed and passed parameters:' + JSON.stringify(queryAsObject));
    // Verify state and auth code
    if (queryAsObject.code == undefined) {
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.write("Problem with redirect URL when authorising dayjob with Spotify.  No authorisation code was received in the URL.  Please try again.");
        log.warn('spotify-server.js: [ERROR] Problem with authorisation code received in the URL, code is ' + queryAsObject.code);
    }
    else if (queryAsObject.state = !state) {
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.write("Problem with redirect URL when authorising dayjob with Spotify.  State code missing or invalid.  Dayjob has ignored the authorisation request.  Please try again.");
        log.warn('spotify-server.js: [ERROR] Problem/mismatched state received in the URL, state is ' + queryAsObject.state);
    }
    else {
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.write("Thanks for authorising dayjob.  You can close this web page.");
        // Show a notification in the app that auth is complete?
        log.warn('spotify-server.js:  Successfully received authorization code ' + queryAsObject.code);
        prefsLocal.setPref('spotify-server_authorizationCode', queryAsObject.code);
        authCodeGrant();
    }
    response.end();
}).listen(8888);


///////////////////////////////////////////////////////////////////
//// Initialise web API instance
///////////////////////////////////////////////////////////////////
//_this = this; 

var spotifyApi = new SpotifyWebApi({
    // Set all these on var creation because setting after isn't working (async issue?)
    clientId: prefsLocal.getPref('spotify-server_clientId'),
    clientSecret: prefsLocal.getPref('spotify-server_clientSecret'),
    redirectUri: redirectUri,
    accessToken: prefsLocal.getPref('spotify-server_access_token'),
    refreshToken: prefsLocal.getPref('spotify-server_refresh_token')
});


///////////////////////////////////////////////////////////////////
//// Check API connection
///////////////////////////////////////////////////////////////////
// Check the API connection each time before using it.  Will reject promise if there is an error condition or accepts if API 'appears' to be ready for use.
// The application using the API must handle the following rejections:  no_client_id, no_authorisation_code

module.exports.checkApiConnection = function () {
    return checkApiConnection();
};

function checkApiConnection() {
    log.warn('spotify-server:  Checking the state of the API connection...')
    return new Promise(function (resolve, reject) {
        if (prefsLocal.getPref('spotify-server_clientId') == undefined || prefsLocal.getPref('spotify-server_clientSecret') == undefined) {
            // Spotify-client hasn't been provided ap ID/secret parameters 
            log.warn('spotify-server:  [ERROR] Cannot authenticate without a client ID and secret.  Get user to create an register an application for API usage with Spotify, and provide the parameters.')
            reject(new Error('no_client_id'));
        }
        else if (prefsLocal.getPref('spotify-server_authorizationCode') == undefined || prefsLocal.getPref('spotify-server_access_token') == undefined) {
            // Not authorised in the past, authorise app and clear access tokens if any
            log.warn('spotify-server.js:  No authorisation code or access token, Spotify not authorised with API before, need to launch auth URL.')
            //launchAuthUrl();
            reject(new Error('no_authorisation_code'));
        }
        else if (new Date().getTime() >= prefsLocal.getPref('spotify-server_token_expiration_date') - 10000) {
            // Token has expired, refresh it
            log.warn('spotify-server.js:  Current time ' + new Date().getTime() + ' exceeds token expiry ' + prefsLocal.getPref('spotify-server_token_expiration_date') + ' within 10000 ms, refreshing token...');
            refreshAccessToken()
                .then(function (data) {
                    resolve('ready')
                }, function (err) {
                    log.warn('spotify-server.js:  [ERROR] Check API connection rejecting promise because refresh access token failed.');
                    //launchAuthUrl();
                    reject(err);
                }).catch(function (err) {
                    log.warn('spotify-server.js:  [ERROR] Exception with refresing access token.', err);
                    reject(err);
                });
        }
        else if (prefsLocal.getPref('spotify-server_user_display_name') == undefined || prefsLocal.getPref('spotify-server_user_id') == undefined) {
            // No Spotify user has been retrieved yet, get the user
            log.warn('spotify-server.js:  User ID and display name are not saved, retrieving them now...');
            spotifyApi.getMe()
                .then(function (data) {
                    log.warn('spotify-server.js:  Retrieved Spotify user data for ' + data.body['display_name'] + ' (' + data.body['id'] + ')');
                    log.warn('spotify-server.js:  Full data JSON: ' + JSON.stringify(data.body));
                    prefsLocal.setPref('spotify-server_user_display_name', data.body['display_name'])
                    prefsLocal.setPref('spotify-server_user_id', data.body['id'])
                    resolve('ready');
                }, function (err) {
                    log.warn('spotify-server.js:  Error retrieving user details from API: ' + err);
                    reject(err);
                }).catch(function (err) {
                    log.warn('spotify-server.js:  Exception retrieving user details from API ' + err);
                    reject(err);
                });
        }

        else {
            log.warn('spotify-server.js:  API appears to be ready for use.');
            resolve('ready');
        }
    });
}

///////////////////////////////////////////////////////////////////
//// Generate auth URL
///////////////////////////////////////////////////////////////////

module.exports.getAuthUrl = function () {
    // spotifyApi.createAuthorizeURL does not return a promise, so we resolve one manually
    return Promise.resolve().then(function () {
        spotifyApi.resetAccessToken();
        spotifyApi.resetRefreshToken();
        prefsLocal.deletePref('spotify-server_access_token');
        prefsLocal.deletePref('spotify-server_refresh_token');
        prefsLocal.deletePref('spotify-server_authorizationCode');
        prefsLocal.deletePref('spotify-server_token_expiration_date');
        prefsLocal.deletePref('spotify-server_user_display_name');
        prefsLocal.deletePref('spotify-server_user_id');
        // Generate random state ID for client to verify request
        state = generateRandomString(16);
        log.warn('spotify-server.js:  Generated random state ID for verifying requests to redirect URI: ' + state);
        // Create URL for authorising app and launch in user's browser
        var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)
        log.warn('spotify-server:  Genearated Auth URL: ' + authorizeURL);
        //Could open the shell here if needed:  shell.openExternal(authorizeURL);
        return authorizeURL;
    })
}

///////////////////////////////////////////////////////////////////
//// Grant auth
///////////////////////////////////////////////////////////////////
// Triggered when the auth web server when callback URL is accessed

function authCodeGrant() {
    // Clear tokens if retrying auth code grant
    spotifyApi.resetAccessToken();
    spotifyApi.resetRefreshToken();
    prefsLocal.deletePref('spotify-server_access_token');
    prefsLocal.deletePref('spotify-server_refresh_token');
    prefsLocal.deletePref('spotify-server_token_expiration_date');
    prefsLocal.deletePref('spotify-server_user_display_name');
    prefsLocal.deletePref('spotify-server_user_id');
    spotifyApi.authorizationCodeGrant(prefsLocal.getPref('spotify-server_authorizationCode'))
        .then(function (data) {
            log.warn('spotify-server.js:  Authorisation granted.');
            log.warn('spotify-server.js:    Access token: ', data.body['access_token']);
            log.warn('spotify-server.js:    Access token expiry: ' + data.body['expires_in']);
            log.warn('spotify-server.js:    Refresh token: ' + data.body['refresh_token']);
            // Save and set the access and refresh tokens
            prefsLocal.setPref('spotify-server_access_token', data.body['access_token']);
            prefsLocal.setPref('spotify-server_refresh_token', data.body['refresh_token']);
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
            // Calculate date of access token expiry in ms
            prefsLocal.setPref('spotify-server_token_expiration_date', new Date().getTime() + data.body['expires_in'] * 1000); //Convert seconds to ms
            log.warn('spotify-server.js:  Token expiration date set (ms):  ' + prefsLocal.getPref('spotify-server_token_expiration_date'));
            return spotifyApi.getMe();
        }).then(function (data) {
            // Success
            log.warn('spotify-server.js:  Connected successfully.  Retrieved data for ' + data.body['display_name']);
            log.warn('spotify-server.js:    Email: ' + data.body.email);
            log.warn('spotify-server.js:    Account type: ' + data.body.product);
            log.warn('spotify-server.js:    Image URL: ' + data.body.images[0].url);
        }).catch(function (err) {
            log.warn('spotify-server.js:  [ERROR] Exception after authorision was not successfully granted.  Try revoking access to the application in the Apps section of your Spotify account, and re-authenticating.  Error ', err.message);
        });
}


///////////////////////////////////////////////////////////////////
//// Refresh access tokens
///////////////////////////////////////////////////////////////////

function refreshAccessToken() {
    return new Promise(function (resolve, reject) {
        spotifyApi.refreshAccessToken()
            .then(function (data) {
                // Save the access token so that it's used in future calls
                spotifyApi.setAccessToken(data.body['access_token']);
                prefsLocal.setPref('spotify-server_access_token', data.body['access_token']);
                log.warn('spotify-server.js:  The access token has been refreshed: ' + data.body['access_token']);
                // Calculate date of access token expiry in ms
                prefsLocal.setPref('spotify-server_token_expiration_date', new Date().getTime() + (data.body['expires_in'] * 1000)); //Convert seconds to ms
                log.warn('spotify-server.js:  Token expiration date refreshed (ms):  ' + new Date().getTime() + " / " + prefsLocal.getPref('spotify-server_token_expiration_date'));
                resolve('access_token_refreshed')
            }, function (err) {
                log.warn('spotify-server.js:  [ERROR] Could not refresh access token.  It is possible the user revoked access to dayjob.  Clearing auth data and re-launching auth URL.  Error ' + err.message);
                //launchAuthUrl();
                reject(err);
            }).catch(function (err) {
                log.warn('spotify-server.js:  [ERROR] Exception with refresing access token.', err.message);
                reject(err);
            });
    })
}

///////////////////////////////////////////////////////////////////
//// API calls 
///////////////////////////////////////////////////////////////////


//// Get the current playling track
///////////////////////////////////////////////////////////////////

module.exports.getMyCurrentPlayingTrack = function () {
    // Directly exports the result of the spotify-web-api-node function
    return spotifyApi.getMyCurrentPlayingTrack();
}

//// Add tracks to playlist
///////////////////////////////////////////////////////////////////

module.exports.addTracksToPlaylist = function (playlistId, tracks) {
    return addTracksToPlaylist(playlistId, tracks)
}

function addTracksToPlaylist(playlistId, tracks){
    // Needs playlistId, tracks, options, callback
    // Example '3EsfV6XzCHU8SPNdbnFogK','["spotify:track:4iV5W9uYEdYUVa79Axb7Rh", "spotify:track:1301WleyT98MSxVHPZCA6M"]'
    return spotifyApi.addTracksToPlaylist(playlistId, tracks);
}

//// Remove track from playlist
///////////////////////////////////////////////////////////////////

module.exports.removeTracksFromPlaylist = function (playlistId, tracks) {
    return removeTracksFromPlaylist (playlistId, tracks) 
}

function removeTracksFromPlaylist (playlistId, tracks) {
    // Needs playlistId, tracks, options, callback
    return spotifyApi.removeTracksFromPlaylist(playlistId, tracks);
}

//// Skip track
///////////////////////////////////////////////////////////////////

// Always returns a resolved promise - just logs any failure silently
module.exports.skipToNext = function() {
    return skipToNext();
}
function skipToNext(){
    spotifyApi.skipToNext()
        .then(function (result){
            log.warn('spotify-server.js: Skipping track result: ' + result);
        }, function (err) {
            log.warn('main.js: Error when talking to Spotify API.  Error ' + err);
        }).catch(function (err) {
            log.warn('main.js:  Exception when talking to Spotify API.  Error ' + err);
        })
    return Promise.resolve();
}

//// Get playlist
///////////////////////////////////////////////////////////////////

module.exports.getPlaylist = function (playlistId) {
    // Directly exports the result of the spotify-web-api-node function
    return spotifyApi.getPlaylist(playlistId);
}

//// Get playlist name
///////////////////////////////////////////////////////////////////

module.exports.getPlaylistName = function(playlistId) {
    return getPlaylistName(playlistId);
}

function getPlaylistName(playlistId){
    return spotifyApi.getPlaylist(playlistId)
        .then(function (result) {
            console.log('result' + result)
            console.log('result.body.name)' + result.body.name)
            return Promise.resolve(result.body.name);
        });
}

// Move the current track from it's existing playlist to the specified playlist

//// Get track context
///////////////////////////////////////////////////////////////////
// Identify the source of the playling track 
// Identify is source is read only 
// Return playlist ID and info if the playlist is the users own 
// COULD BE IMPROVED to always return the playlist name if available, e.g. for radio and shared playlists

function getTrackContext(playlingTrackJson){
    return new Promise(function (resolve, reject) {
        context = new Object();  //store context name, readOnly and sourcePlaylistId 
        context.name = null;
        context.readOnly=true;
        context.sourcePlaylistId = null;
        context.sourcePlaylistName = null;
        if (playlingTrackJson.body.currently_playing_type == "episode") {context.name = "Podcast"}   
        else if (playlingTrackJson.body.item.is_local) {context.name = "Local file"}  
        else if (playlingTrackJson.body.context == null) {context.name = "Liked or Recommended"} 
        else if (playlingTrackJson.body.context.type == "artist"){context.name = "Artist"}                                                      // Artist playback - add only
        else if (playlingTrackJson.body.context.type == "album"){context.name = "Album"}                                                        // Album playback - add only
        else if (playlingTrackJson.body.context.type == "playlist" && playlingTrackJson.body.context.uri.split(':').length == 5) {
            if (playlingTrackJson.body.context.uri.split(':')[2] == prefsLocal.getPref('spotify-server_user_id')){                                                                                                                                  // Playlist - add / remove
                // Only return playlist ID and name if playlist owned by the user 
                context.name = "Playlist"      
                context.readOnly=false;
                context.sourcePlaylistId = serverCurrentPlayingTrackJson.body.context.uri.split(':')[4];
                log.warn('spotify-server.js:  Getting playlist info for playlist ID... ' + context.sourcePlaylistId)
                return getPlaylistName(sourcePlaylistId);
            }    
            else {context.name = "Shared playlist / Radio"}                                                                                                       // Shared playlist - remove only
        }   
        else {playingTrackContext = "Unknown source"}
        return Promise.resolve(null)
    }).then(function (result){
        context.sourcePlaylistName = result;
        log.warn('spotify-server.js:  Got source playlist name: ' +sourcePlaylistName);
        return Promise.resolve(context);
    });
}



//// Copy, move or remove playing track to specified playlist 
///////////////////////////////////////////////////////////////////

module.exports.removePlayingTrackFromPlaylist = function() {
    return actionPlayingTrack('remove');
}

module.exports.copyPlayingTrackToPlaylist = function(destPlaylistId, destPlaylistName) {
    return actionPlayingTrack('copy',destPlaylistId, destPlaylistName);
}

module.exports.movePlayingTrackToPlaylist = function(destPlaylistId, destPlaylistName) {
    return actionPlayingTrack('move',destPlaylistId, destPlaylistName);
}

// Valid actions are copy, remove, move
function actionPlayingTrack (action, destPlaylistId, destPlaylistName){ 
    var serverCurrentPlayingTrackJson;
    var playingTrackUri;
    var playingTrackName;
    var playingTrackArtistName;
    var playingTrackAlbumName;
    var playingTrackContext;
    return new Promise(function (resolve, reject){
        if (action != 'copy' || action != 'remove' || action != 'move'){
            Promise.reject('invalid_action')
        }
        return checkApiConnection()
    }).then (function (result) {
        log.warn('spotify-server.js:  Check API connection succeeded, now getting currently playing track info...');
        return spotifyApi.getMyCurrentPlayingTrack()
    }).then(function (result) {
        serverCurrentPlayingTrackJson = result;
        log.warn('spotify-server.js:  Got serverCurrentPlayingTrackJson: ' + JSON.stringify(serverCurrentPlayingTrackJson));
        return getTrackContext(serverCurrentPlayingTrackJson)
    }).then(function (result) {    
        playingTrackContext = context
        log.warn('spotify-server.js:  Got track context: ' + JSON.stringify(playingTrackContext));  
        log.warn('spotify-server.js:  Track to be processed:  \n' + 
                                        'playingTrackUri is: ' + playingTrackUri + '\n' + 
                                        'playingTrackName is: ' + playingTrackName + '\n' + 
                                        'playingTrackName is: ' + playingTrackName + '\n' + 
                                        'playingTrackArtistName is: ' + playingTrackArtistName + '\n' + 
                                        'playingTrackAlbumName is: ' + playingTrackAlbumName + '\n' + 
                                        'playingTrackContext.name: ' + playingTrackContext.name + '\n' + 
                                        'playingTrackContext.readOnly: ' + playingTrackContext.readOnly + '\n' + 
                                        'playingTrackContext.sourcePlaylistId: ' + playingTrackContext.sourcePlaylistId + '\n' + 
                                        'sourcePlaylistName is: ' + playingTrackContext.sourcePlaylistName + '\n' + 
                                        'destPlaylistId is: ' + destPlaylistId + '\n' + 
                                        'destPlaylistName is: ' + destPlaylistName + '\n' +
                                        'ACTION:  ' + action);
        // Copying stage - 
        if (action == 'copy' || action == 'move'){
            log.warn('spotify-server.js:  Adding track ' + playingTrackName + ', ' + playingTrackAlbumName + ', ' + playingTrackArtistName + ', ' + playingTrackUri + ' to ' + destPlaylistName + ' : ' + destPlaylistId);
            return addTracksToPlaylist(destPlaylistId, [playingTrackUri])
        }
        if (action == 'remove'){
            return Promise.resolve(null)
        }   
    }).then(function (result) {      
        log.warn('spotify-server.js:  Added track ' + playingTrackName + ', ' + playingTrackAlbumName + ', ' + playingTrackArtistName + ', ' + playingTrackUri + ' to ' + destPlaylistName + ' : ' + destPlaylistId); 
        // Removal stage
        if ((action == 'move' || action == 'remove') && !playingTrackContext.readOnly){
            log.warn('spotify-server.js:  Removing track ' + playingTrackName + ', ' + playingTrackAlbumName + ', ' + playingTrackArtistName + ', ' + playingTrackUri + ' from ' + sourcePlaylistName + " , " + sourcePlaylistId);
            return removeTracksFromPlaylist(sourcePlaylistId, [{ uri: playingTrackUri }]) 
        }
        else if (action == 'move' && playingTrackContext.readOnly){
            //Read only, can't remove
            log.warn('spotify-server.js:  NOT removing track ' + playingTrackName + ', ' + playingTrackAlbumName + ', ' + playingTrackArtistName + ', ' + playingTrackUri + ' because the the track source is ' + playingTrackContext);
            return Promise.resolve("copied_cannot_move")
        }
        else if (action == 'remove' && playingTrackContext.readOnly){
            //Read only, can't remove
            log.warn('spotify-server.js:  NOT removing track ' + playingTrackName + ', ' + playingTrackAlbumName + ', ' + playingTrackArtistName + ', ' + playingTrackUri + ' because the the track source is ' + playingTrackContext);
            return Promise.resolve("cannot_remove")
        }
        else{
            // If no removal required (e.g. copy), finish here
            return Promise.resolve("copied")
        }
    }).then(function (result) {    
        log.warn('spotify-server.js:  Removed track ' + playingTrackName + ', ' + playingTrackAlbumName + ', ' + playingTrackArtistName + ', ' + playingTrackUri + ' from ' + sourcePlaylistName + " , " + sourcePlaylistId);
        return Promise.resolve(JSON.parse('{"playingTrackName":"' + playingTrackName + '", "playingTrackAlbumName":"' + playingTrackAlbumName + '", "playingTrackArtistName":"' + playingTrackArtistName + '", "playingTrackUri":"' + playingTrackUri + '", "playingTrackContext":"' + playingTrackContext + '", "sourcePlaylistName":"' + sourcePlaylistName + '", "sourcePlaylistId":"' + sourcePlaylistId + '", "destPlaylistName":"' + destPlaylistName + '", "destPlaylistId":"' + destPlaylistId + '"}'));  
    });
}


// DELETE ME //


module.exports.movePlayingTrackToPlaylist = function(destPlaylistId,destPlaylistName){
    var serverCurrentPlayingTrackJson;
    var playingTrackContext;
    var playingTrackName;
    var playingTrackAlbumName;
    var playingTrackArtistName;
    var playingTrackUri;
    var sourcePlaylistId;
    var sourcePlaylistName;

    return checkApiConnection()
        .then(function (result) {
            log.warn('spotify-server.js:  Getting currently playing track info');
            return spotifyApi.getMyCurrentPlayingTrack()
        }).then(function (result) {
            serverCurrentPlayingTrackJson = result;
            log.warn('spotify-server.js:  Got serverCurrentPlayingTrackJson: ' + JSON.stringify(serverCurrentPlayingTrackJson));
            return getTrackContext(serverCurrentPlayingTrackJson)
        }).then(function (result) {    
            log.warn('spotify-server.js:  Got track context: ' + JSON.stringify(context));
            // Determine if we can remove or move the track through the context.readOnly property
            playingTrackContext = context.name
            sourcePlaylistId = context.sourcePlaylistId
            // Get track info to add (should always be the same regardless of context)
            playingTrackName = serverCurrentPlayingTrackJson.body.item.name;
            playingTrackAlbumName = serverCurrentPlayingTrackJson.body.item.album.name;
            playingTrackArtistName = serverCurrentPlayingTrackJson.body.item.artists[0].name;
            playingTrackUri = serverCurrentPlayingTrackJson.body.item.uri;
            log.warn('spotify-server.js:  playingTrackContext: ' + playingTrackContext);
            log.warn('spotify-server.js:  sourcePlaylistId is: ' + sourcePlaylistId);
            log.warn('spotify-server.js:  playingTrackName is: ' + playingTrackName);
            log.warn('spotify-server.js:  playingTrackAlbumName is: ' + playingTrackAlbumName);
            log.warn('spotify-server.js:  playingTrackArtistName is: ' + playingTrackArtistName);
            log.warn('spotify-server.js:  playingTrackUri is: ' + playingTrackUri);
            log.warn('spotify-server.js:  destPlaylistId is: ' + destPlaylistId);
            // Now get the playlist details only if the context is of type 'playlist'
            // TODO - this is hacky, need a better way to exit out of promises if we cannot continue with all steps
            if (playingTrackContext == 'playlist'){
                log.warn('spotify-server.js:  Getting playlist info for playlist ID ' + sourcePlaylistId)
                return getPlaylistName(sourcePlaylistId);
            }
            else {
                // No playlis ID, just return null
                sourcePlaylistId = null;
                return Promise.resolve(sourcePlaylistId);
            } 
        }).then(function (result) {
            sourcePlaylistName = result;
            log.warn('spotify-server.js:  sourcePlaylistName is: ' + sourcePlaylistName);
            // Add the track to a new playlist
            log.warn('spotify-server.js:  Adding track ' + playingTrackName + ', ' + playingTrackAlbumName + ', ' + playingTrackArtistName + ', ' + playingTrackUri + ' to ' + destPlaylistName + ' : ' + destPlaylistId);
            return addTracksToPlaylist(destPlaylistId, [playingTrackUri])
        }).then(function (result) {
            log.warn('spotify-server.js:  Added track ' + playingTrackName + ', ' + playingTrackAlbumName + ', ' + playingTrackArtistName + ', ' + playingTrackUri + ' to ' + destPlaylistName + ' : ' + destPlaylistId);
            if (sourcePlaylistId != null){
                // Finally remove the track from the current playlist, but only if a playlist ID was provided
                log.warn('spotify-server.js:  Removing track ' + playingTrackName + ', ' + playingTrackAlbumName + ', ' + playingTrackArtistName + ', ' + playingTrackUri + ' from ' + sourcePlaylistName + " , " + sourcePlaylistId);
                return removeTracksFromPlaylist(sourcePlaylistId, [{ uri: playingTrackUri }]) 
            }
            else {
                log.warn('spotify-server.js:  NOT removing track ' + playingTrackName + ', ' + playingTrackAlbumName + ', ' + playingTrackArtistName + ', ' + playingTrackUri + ' because the the track source is ' + playingTrackContext);
                return Promise.resolve(null);
            }
                  
        }).then(function (result) {
            // We're done, log and show notification
            if (sourcePlaylistId != null){
                log.warn('spotify-server.js:  Removed track ' + playingTrackName + ', ' + playingTrackAlbumName + ', ' + playingTrackArtistName + ', ' + playingTrackUri + ' from ' + sourcePlaylistName + " , " + sourcePlaylistId);
            }
            return Promise.resolve(JSON.parse('{"playingTrackName":"' + playingTrackName + '", "playingTrackAlbumName":"' + playingTrackAlbumName + '", "playingTrackArtistName":"' + playingTrackArtistName + '", "playingTrackUri":"' + playingTrackUri + '", "playingTrackContext":"' + playingTrackContext + '", "sourcePlaylistName":"' + sourcePlaylistName + '", "sourcePlaylistId":"' + sourcePlaylistId + '", "destPlaylistName":"' + destPlaylistName + '", "destPlaylistId":"' + destPlaylistId + '"}'));
        })
        /*
        // DON'T BELIEVE ANY OF THIS IS NEEDED BECAUSE ERROR HANDING IS IN THE CALLER, BUT IT MEANS THE CONTEXT OF THE ERROR WILL BE LOST
        , function (err) {
            log.warn('spotify-server.js:  Error when talking to Spotify API for adding track to ' + destPlaylistId + '.  Error ' + err);
        }).catch(function (err) {
            log.warn('spotify-server.js:  Exception when talking to Spotify API for adding track to ' + destPlaylistId + '.  Error ' + err);
            Promise.reject(JSON.parse('{"err":"' + err + '","playingTrackName":"' + playingTrackName + '", "playingTrackAlbumName":"' + playingTrackAlbumName + '", "playingTrackArtistName":"' + playingTrackArtistName + '", "playingTrackUri":"' + playingTrackUri + '", "sourcePlaylistName":"' + sourcePlaylistName + '", "sourcePlaylistId":"' + sourcePlaylistId + '", "destPlaylistName":"' + destPlaylistName + '", "destPlaylistId":"' + destPlaylistId + '"}'));
        })
        */
}


///////////////////////////////////////////////////////////////////
//// PLAYGROUND
///////////////////////////////////////////////////////////////////
// Functions here are for future features and are not currently used


//// Get user playlists
///////////////////////////////////////////////////////////////////

module.exports.getUserPlaylists = function () {
    // Directly exports the result of the spotify-web-api-node function
    return spotifyApi.getUserPlaylists();
}

//// Check if song exists in playlist
///////////////////////////////////////////////////////////////////

// Call the getPlaylistTracks recursively until we have all pages of the playlist tracks??
module.exports.ifSongExistsInPlaylist = function (trackUri, playlistId) {
    return spotifyApi.getPlaylistTracks(prefsLocal.getPref('spotify-server_user_id'), playlistId, { offset: 0 })
        .then(function (result) {
            console.log('spotify-server.js:  Got playlist tracks JSON: ' + JSON.stringify(result));
            console.log('spotify-server.js:  Got playlist tracks JSON with an offset of ' + result.body.offset + ' of ' + result.body.total + ' tracks (limit: ' + result.body.limit) + ')';
            return Promise.resolve(result);
        }).then(function (result) {
            var found = false;
            console.log('spotify-server.js:  Checking playlist ' + playlistId + ' with ' + result.body.items.length + ' tracks for track URI ' + trackUri);
            for (var i = 0; i < 34; ++i) {

                if (result.body.items[i].track.uri == trackUri) {
                    console.log('spotify-server.js:    ' + trackUri + ' matched at track position ' + i);
                    found = true;
                }

            }
            return Promise.resolve(found);
        });
}

/*
module.exports.getMyCurrentPlayingTrack = function(){
    /*return new Promise(function (resolve, reject){
    checkApiConnection()
    .then(spotifyApi.getMyCurrentPlayingTrack())
    
    /*.then(function(data){
        log.warn('spotify-server.js:  My currently playing track: ' + data.body.item['uri']);
        log.warn('spotify-server.js:  My currently playing track playlist: ' +  data.body.context['uri']);
        //resolve (data.body)
    
    
    })
    
    ,function(err){
        log.warn('spotify-server.js:  Error retrieving my currently playing track from API ' + err);
        reject (err);
    }).catch(function(err){
        log.warn('spotify-server.js:  Exception retrieving my currently playing track from API ' + err);
        reject (err);
    });
    }, function(err){
        log.warn('spotify-server.js:  Error when calling Spotify API getMyCurrentPlayingTrack: ' + err);
        reject (err);
    }).catch(function(err){
        log.warn('spotify-server.js:  Exception when calling Spotify API getMyCurrentPlayingTrack ' + err);
        reject (err);
    });
    /*})
};

*/





/*

module.exports.getPlaylist = function(id,uri){
    return new Promise(function (resolve, reject){
        checkApiConnection()
        .then(function(data){
            spotifyApi.getPlaylist(id,uri)
            .then(function(data){
                log.warn('spotify-server.js:  Retrieved playlist: ' + JSON.stringify(data.body));
                resolve (data.body)
            },function(err){
                log.warn('spotify-server.js:  Error retrieving playlist from API ' + err);
                reject (err);
            }).catch(function(err){
                log.warn('spotify-server.js:  Exception retrieving playlist from API ' + err);
                reject (err);
            });
        }, function(err){
            log.warn('spotify-server.js:  Error when calling Spotify API getPlaylist: ' + err);
            reject (err);
        }).catch(function(err){
            log.warn('spotify-server.js:  Exception when calling Spotify API getPlaylist ' + err);
            reject (err);
        });
    });
}

*/



/* 
module.exports.removeCurrentPlayingTrackFromPlaylist = function(){
    return new Promise(function (resolve, reject){
        checkApiConnection()
        .then(function(data){
            // Finish me
            //removeTracksFromPlaylist: function(userId, playlistId, tracks, options, callback) 
            //spotifyApi.removeTracksFromPlaylist(prefsLocal.getPref('spotify-server_user_id'))
        }, function(err){
            log.warn('spotify-server.js:  Error when calling Spotify API removeCurrentPlayingTrackFromPlaylist: ' + err);
            reject (err);
        }).catch(function(err){
            log.warn('spotify-server.js:  Exception when calling Spotify API removeCurrentPlayingTrackFromPlaylist ' + err);
        });
    })
}

*/




/* 
module.exports.addTracksToPlaylist = function(trackUri, playlistUri){
    return new Promise (function (resolve, reject){
        checkApiConnection()
        .then(function(data){
            // do somethig
        }, function(err){
            log.warn('spotify-server.js:  Error when calling Spotify API addTracksToPlaylist: ' + err);
            reject (err);
        }).catch(function(err){
            log.warn('spotify-server.js:  Exception when calling Spotify API addTracksToPlaylist ' + err);
        });
    })
}

*/

/* TODO
*  getFollowedArtists
*  getUserPlaylists: function(userId, options, callback) {
*  addTracksToPlaylist: function(userId, playlistId, tracks, options, callback) {
*  removeTracksFromPlaylist: function(userId, playlistId, tracks, options, callback) {
*  createPlaylist: function(userId, playlistName, options, callback) {   
*/


///////////////////////////////////////////////////////////////////
//// API calls 
///////////////////////////////////////////////////////////////////

/*
module.exports.getRecentlyPlayedTracks = function(){
    return new Promise(function (resolve, reject){
        spotifyApi.getMyRecentlyPlayedTracks()
        .then(function(data){
            log.warn('spotify-server.js:  My recently played tracks: ' +  JSON.stringify(data.body));
            resolve (data.body)
        },function(err){
            log.warn('spotify-server.js:  Error retrieving my recently played tracks from API ' + err);
        }.catch(function(err){
            log.warn('spotify-server.js:  Exception retrieving my recently played tracks from API ' + err);
            reject (err);
        });
    });
}
*/

///////////////////////////////////////////////////////////////////
//// Playlist settings
///////////////////////////////////////////////////////////////////

// function addPlaylist??

///////////////////////////////////////////////////////////////////
//// Helper functions
///////////////////////////////////////////////////////////////////

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
