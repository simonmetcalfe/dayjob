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
var state; //For dayjob to verify requests to the redirect URI
var spotifyUserId;
var spotifyDisplayName;

///////////////////////////////////////////////////////////////////
//// Variables external access
///////////////////////////////////////////////////////////////////

module.exports.getSpotifyUserId = function(){return spotifyUserId;}
module.exports.getspotifyDisplayName = function(){return spotifyDisplayName;}

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
        // TODO - if Promise response fails, show a messsage
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
    return Promise.resolve().then(function(){
        if (prefsLocal.getPref('spotify-server_clientId') == undefined || prefsLocal.getPref('spotify-server_clientSecret') == undefined) {
            // Spotify-client hasn't been provided ap ID/secret parameters 
            log.warn('spotify-server:  [ERROR] Cannot authenticate without a client ID and secret.  Get user to create an register an application for API usage with Spotify, and provide the parameters.')
            Promise.reject(new Error('no_client_id'));
        }
        else if (prefsLocal.getPref('spotify-server_authorizationCode') == undefined || prefsLocal.getPref('spotify-server_access_token') == undefined) {
            // Not authorised in the past, authorise app and clear access tokens if any
            log.warn('spotify-server.js:  No authorisation code or access token, Spotify not authorised with API before, need to launch auth URL.')
            Promise.reject(new Error('no_authorisation_code'));
        }
        else if (new Date().getTime() >= prefsLocal.getPref('spotify-server_token_expiration_date') - 10000) {
            // Token has expired, refresh it
            log.warn('spotify-server.js:  Current time ' + new Date().getTime() + ' exceeds token expiry ' + prefsLocal.getPref('spotify-server_token_expiration_date') + ' within 10000 ms, refreshing token...');
            return refreshAccessToken()
        } 
        else {
            log.warn('spotify-server.js:  Access token appears to be valid.');
            Promise.resolve('ready');
        }
    }).then(function (result) {
        if (spotifyDisplayName == undefined || spotifyUserId == undefined) {
            // No Spotify user has been retrieved yet, get the user
            log.warn('spotify-server.js:  User ID and display name are not saved, retrieving them now...');
            return spotifyApi.getMe()
        } 
        else {
            log.warn('spotify-server.js:  Already have user ID and display name; no need to query API.');
            return Promise.resolve('ready');
        } 
    }).then(function (result){   
        if (result != 'ready'){
            // Log the result of .getMe and store the users name and ID 
            log.warn('spotify-server.js:  Retrieved user data JSON: ' + JSON.stringify(result.body));
            spotifyDisplayName = result.body.display_name;
            spotifyUserId = result.body.id;
        }
        log.warn('spotify-server.js:  Spotify connected for user ' + spotifyDisplayName + ' (' + spotifyUserId + ')');    
        return Promise.resolve('ready');
    },function (err){
        /* TODO - It migh be worth changing this to a .catch handler just in case the returned JSON is garbage and an error occurs in the result() statement above */
        // Handle spotifyApi.getMe promise error gracefully
        handledErr = new Error("cannot_get_users_details")
        handledErr.error = err;
        return Promise.reject(handledErr);
    })
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
        spotifyDisplayName = undefined;
        spotifyUserId = undefined;
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
    spotifyDisplayName = undefined;
    spotifyUserId = undefined;
    spotifyApi.authorizationCodeGrant(prefsLocal.getPref('spotify-server_authorizationCode'))
        .then(function (result) {
            log.warn('spotify-server.js:  Authorisation granted.');
            log.warn('spotify-server.js:    Access token: ', result.body.access_token);
            log.warn('spotify-server.js:    Access token expiry: ' + result.body.expires_in);
            log.warn('spotify-server.js:    Refresh token: ' + result.body.refresh_token);
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
        }).then(function (result) {
            // Success
            log.warn('spotify-server.js:  Connected successfully.  Retrieved data for ' + result.body.display_name);
            log.warn('spotify-server.js:    Email: ' + result.body.email);
            log.warn('spotify-server.js:    Account type: ' + result.body.product);
            log.warn('spotify-server.js:    Image URL: ' + result.body.images[0].url);
            Promise.resolve(result) // TODO - Should this return a custom message, e.g. 'authorisation_granted'?
        }).catch(function (err) {
            log.warn('spotify-server.js:  [ERROR] Exception after authorision was not successfully granted.  Try revoking access to the application in the Apps section of your Spotify account, and re-authenticating.  Error ', err.message);
            // Handle spotifyApi.authorizationCodeGrant() and spotifyApi.getMe() promise errors gracefully
            handledErr = new Error("error_authorising")
            handledErr.error = err;
            return Promise.reject(handledErr);
        });
}


///////////////////////////////////////////////////////////////////
//// Refresh access tokens
///////////////////////////////////////////////////////////////////

function refreshAccessToken() {
    return spotifyApi.refreshAccessToken()
        .then(function (result) {
            log.warn('spotify-server.js:  The access token has been refreshed: ' + result.body.access_token);
            // Save the access token so that it's used in future calls (setAccessToken does not return a Promise)
            spotifyApi.setAccessToken(result.body.access_token);
            prefsLocal.setPref('spotify-server_access_token', result.body.access_token);
            // Calculate date of access token expiry in ms
            prefsLocal.setPref('spotify-server_token_expiration_date', new Date().getTime() + (result.body.expires_in * 1000)); //Convert seconds to ms
            log.warn('spotify-server.js:  The access token expiration date refreshed (ms):  ' + new Date().getTime() + " / " + prefsLocal.getPref('spotify-server_token_expiration_date'));
            return Promise.resolve('access_token_refreshed')
        }, function (err) {
            // TODO - replace with catch
            log.warn('spotify-server.js:  [ERROR] Could not refresh access token.  It is possible the user revoked access to dayjob.  Clearing auth data and re-launching auth URL.  Error ' + err.message);
            // Handle spotifyApi.refreshAccessToken promise error gracefully
            handledErr = new Error("cannot_refresh_access_token")
            handledErr.error = err;
            return Promise.reject(handledErr);
        })
}

///////////////////////////////////////////////////////////////////
//// API calls 
///////////////////////////////////////////////////////////////////


//// Get the current playling track
///////////////////////////////////////////////////////////////////

function getMyCurrentPlayingTrack() {
    // Directly exports the result of the spotify-web-api-node function
    return spotifyApi.getMyCurrentPlayingTrack()
        .then(function (result){
            return Promise.resolve(result);
        },function (err){
            // TODO - replace with Catch?
            // Handle external promise error gracefully
            handledErr = new Error("cannot_get_playing_track_info")
            handledErr.error = err;
            return Promise.reject(handledErr);
        })
}

//// Add tracks to playlist
///////////////////////////////////////////////////////////////////

module.exports.addTracksToPlaylist = function (playlistId, tracks) {
    return addTracksToPlaylist(playlistId, tracks)
}

function addTracksToPlaylist(playlistId, tracks){
    // Needs playlistId, tracks
    // Example '3EsfV6XzCHU8SPNdbnFogK','["spotify:track:4iV5W9uYEdYUVa79Axb7Rh", "spotify:track:1301WleyT98MSxVHPZCA6M"]'
    return spotifyApi.addTracksToPlaylist(playlistId, tracks)
        .then(function (result){
            return Promise.resolve(result);
        },function (err){
            //TODO - Replace with catch?
            // Handle external promise error gracefully
            handledErr = new Error("cannot_add_track_to_playlist")
            handledErr.error = err;
            return Promise.reject(handledErr);
        })
}

//// Remove track from playlist
///////////////////////////////////////////////////////////////////

module.exports.removeTracksFromPlaylist = function (playlistId, tracks) {
    return removeTracksFromPlaylist (playlistId, tracks) 
}

function removeTracksFromPlaylist (playlistId, tracks) {
    // Needs playlistId, tracks, options, callback
    return spotifyApi.removeTracksFromPlaylist(playlistId, tracks)
        .then(function (result){
            return Promise.resolve(result);
        },function (err){
            // TODO - Replace with catch?
            // Handle external promise error gracefully
            handledErr = new Error("cannot_remove_track_from_playlist")
            handledErr.error = err;
            return Promise.reject(handledErr);
        })
}


//// Get playlist
///////////////////////////////////////////////////////////////////

function getPlaylist(playlistId) {
    // Directly exports the result of the spotify-web-api-node function
    return spotifyApi.getPlaylist(playlistId)
        .then(function (result){
            //log.warn('spotify-server.js:  Retrieved playlist \'' + playlistId + ', JSON: ' + JSON.stringify(result));
            return Promise.resolve(result);
        },function (err){
            // TODO - Replace with catch?
            // Handle external promise error gracefully
            handledErr = new Error("cannot_get_playlist_info")
            handledErr.error = err;
            return Promise.reject(handledErr);
        })
}

//// Get playlist name
///////////////////////////////////////////////////////////////////

module.exports.getPlaylistName = function(playlistId) {
    return getPlaylistName(playlistId);
}

function getPlaylistName(playlistId){
    return getPlaylist(playlistId)
    .then(function (result){
        log.warn('spotify-server.js:  Retrieved playlist name \'' + result.body.name + '\' for playlist \'' + playlistId + '\'');
        return Promise.resolve(result.body.name);
    })
}

//// Skip track
///////////////////////////////////////////////////////////////////

module.exports.skipToNext = function() {
    return skipToNext();
}
function skipToNext(){
    return spotifyApi.skipToNext()
        .then(function (result){
            log.warn('spotify-server.js: Skipping track using Spotify API successful: ' + result);
            return Promise.resolve(result);
        },function (err){
            log.warn('spotify-server.js: Skipping track using Spotify API failed but error is ignored: ' + err);
            // Always returns a resolved promise even on failure, just logs failure silently
            return Promise.resolve(null);
        })
}

//// Parse playing track info
///////////////////////////////////////////////////////////////////
// This is in a separate function so that we can capture any errors that occur
// Returns a JSON object 'trackinfo'

function parsePlayingTrackInfo(playingTrackJson){
    trackInfo = {
        context:{}
    }
    return Promise.resolve().then(function () {

        // Detect unsupported responses and reject
        if (playingTrackJson.statusCode == 204){return Promise.reject(new Error("track_not_playing"))}  // No music is playing
        if (playingTrackJson.body.currently_playing_type == "episode"){return Promise.reject(new Error("track_is_podcast"))}  // We can't process podcasts at all so just abort 
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
        // Determine context
        if      (playingTrackJson.body.item.is_local)               {trackInfo.context.name = "Local file" }  
        else if (playingTrackJson.body.context == null)             {trackInfo.context.name = "Liked or Recommended" }         
        else if (playingTrackJson.body.context.type == "artist")    {trackInfo.context.name = "Artist"}                       
        else if (playingTrackJson.body.context.type == "album")     {trackInfo.context.name = "Album"}             
        else if (playingTrackJson.body.context.type == "playlist" && playingTrackJson.body.context.uri.split(':').length == 3) {trackInfo.context.name = "Radio"} // When radio songs played from radio thumbnail         
        else if (playingTrackJson.body.context.type == "playlist" && playingTrackJson.body.context.uri.split(':').length == 5) {
            if (playingTrackJson.body.context.uri.split(':')[2] == spotifyUserId){
                trackInfo.context.readOnly=false;
                trackInfo.context.name = "Playlist"    
            }    
            else {trackInfo.context.name = "Shared playlist / Radio";}  // Radio songs indistinguisable from shared playlists if songs are played from the list screen
            trackInfo.context.sourcePlaylistId = playingTrackJson.body.context.uri.split(':')[4];
            log.warn('spotify-server.js:  Getting playlist name for playlist ID... ' + trackInfo.context.sourcePlaylistId)
            return getPlaylistName(trackInfo.context.sourcePlaylistId)
        }
        else {trackInfo.context.name = "Unknown source";}
        return Promise.resolve('ready')
    }).then(function(result){
        if (result != 'ready'){
            // Set the source playlist name
            trackInfo.context.sourcePlaylistName = result
        }
        return Promise.resolve(trackInfo)
    }, function (err){
        // TODO - Should be catch?
        // Catch any errors we might have parsing the JSON
        handledErr = new Error("error_parsing_playing_track_json")
        handledErr.error = err;
        return Promise.reject(handledErr);
    })
}


//// Get playing track info
///////////////////////////////////////////////////////////////////
// Get basic track info from JSON response
// Identify the source of the playling track using logic, and if it is read only 
// Lookup name of playlist if possible (2nd API call)

module.exports.getPlayingTrackInfo = function() {
    return getPlayingTrackInfo();
}

function getPlayingTrackInfo(){
    trackInfo = {
        context:{}
    }
    return checkApiConnection()
        .then(function (result) {
            log.warn('spotify-server.js:  Check API connection succeeded, now getting currently playing track info...');
            return getMyCurrentPlayingTrack()
        }).then(function (result) {
            log.warn('spotify-server.js:  Got current track JSON: ' + JSON.stringify(result));
            return parsePlayingTrackInfo(result)
        })
}

//// Remove playing track from its playlist 
///////////////////////////////////////////////////////////////////

module.exports.removePlayingTrackFromPlaylist = function() {
    return removePlayingTrackFromPlaylist()
}

function removePlayingTrackFromPlaylist(){
    trackInfo = {};
    return getPlayingTrackInfo()
        .then(function (result) {
            trackInfo = result;
            if (trackInfo.context.readOnly == true){
                // Can't modify the playlist so throw an error
                return Promise.reject(new Error("playlist_is_read_only")) //TODO - Does not communicate playlist name, may need to improve this, maybe don't throw an error
            }
            log.warn('spotify-server.js:  Removing track ' + trackInfo.name + ', ' + trackInfo.albumName + ', ' + trackInfo.artistName + ', ' + trackInfo.uri + ' from ' + trackInfo.context.sourcePlaylistName + " , " + trackInfo.context.sourcePlaylistId);
            return removeTracksFromPlaylist(trackInfo.context.sourcePlaylistId, [{ uri: trackInfo.uri }])  
        }).then(function (result) {    
            log.warn('spotify-server.js:  Removed track ' + trackInfo.name + ', ' + trackInfo.albumName + ', ' + trackInfo.artistName + ', ' + trackInfo.uri + ' from ' + trackInfo.context.sourcePlaylistName + " , " + trackInfo.context.sourcePlaylistId);
            trackInfo.result = result
            return Promise.resolve(trackInfo)
        });
}

//// Copy OR Move playing track to specified playlist based on parameter
///////////////////////////////////////////////////////////////////

module.exports.copyOrMovePlayingTrackToPlaylist = function(destPlaylistId, destPlaylistName, move) {
    if (move == 0) {return copyPlayingTrackToPlaylist(destPlaylistId, destPlaylistName);}
    if (move == 1) {return movePlayingTrackToPlaylist(destPlaylistId, destPlaylistName);}
}


//// Copy playing track to specified playlist 
///////////////////////////////////////////////////////////////////

module.exports.copyPlayingTrackToPlaylist = function(destPlaylistId, destPlaylistName) {
    return copyPlayingTrackToPlaylist(destPlaylistId, destPlaylistName);
}

function copyPlayingTrackToPlaylist(destPlaylistId, destPlaylistName){
    trackInfo = {};
    return getPlayingTrackInfo()
        .then(function (result) {
            trackInfo = result;
            trackInfo.destPlaylistId = destPlaylistId;
            trackInfo.destPlaylistName = destPlaylistName;
            log.warn('spotify-server.js:  Adding track ' + trackInfo.name + ', ' + trackInfo.albumName + ', ' + trackInfo.artistName + ', ' + trackInfo.uri + ' from ' + trackInfo.context.sourcePlaylistName + " , " + trackInfo.context.sourcePlaylistId + " to " + trackInfo.destPlaylistId + " , " + trackInfo.destPlaylistName);
            return addTracksToPlaylist(trackInfo.destPlaylistId, [trackInfo.uri])
        }).then(function (result) {    
            log.warn('spotify-server.js:  Added track ' + trackInfo.name + ', ' + trackInfo.albumName + ', ' + trackInfo.artistName + ', ' + trackInfo.uri + ' from ' + trackInfo.context.sourcePlaylistName + " , " + trackInfo.context.sourcePlaylistId + " to " + trackInfo.destPlaylistId + " , " + trackInfo.destPlaylistName);
            trackInfo.result = result
            return Promise.resolve(trackInfo)
        });
}

//// Move playing track from current playlist to specified playlist 
///////////////////////////////////////////////////////////////////

module.exports.movePlayingTrackToPlaylist = function(destPlaylistId, destPlaylistName) {
    return movePlayingTrackToPlaylist(destPlaylistId, destPlaylistName);
}

function movePlayingTrackToPlaylist(destPlaylistId, destPlaylistName){
    trackInfo = {};
    return getPlayingTrackInfo()
        .then(function (result) {
            trackInfo = result;
            trackInfo.destPlaylistId = destPlaylistId;
            trackInfo.destPlaylistName = destPlaylistName;
            log.warn('spotify-server.js:  Adding track ' + trackInfo.name + ', ' + trackInfo.albumName + ', ' + trackInfo.artistName + ', ' + trackInfo.uri + ' from ' + trackInfo.context.sourcePlaylistName + " , " + trackInfo.context.sourcePlaylistId + " to " + trackInfo.destPlaylistId + " , " + trackInfo.destPlaylistName);
            return addTracksToPlaylist(trackInfo.destPlaylistId, [trackInfo.uri])
        }).then(function (result) {    
            log.warn('spotify-server.js:  Added track ' + trackInfo.name + ', ' + trackInfo.albumName + ', ' + trackInfo.artistName + ', ' + trackInfo.uri + ' from ' + trackInfo.context.sourcePlaylistName + " , " + trackInfo.context.sourcePlaylistId + " to " + trackInfo.destPlaylistId + " , " + trackInfo.destPlaylistName);
            log.warn('spotify-server.js:  Removing track ' + trackInfo.name + ', ' + trackInfo.albumName + ', ' + trackInfo.artistName + ', ' + trackInfo.uri + ' from ' + trackInfo.context.sourcePlaylistName + " , " + trackInfo.context.sourcePlaylistId);
            //TODO - copy tracks instead of moving them when the track source is read-only
            return removeTracksFromPlaylist(trackInfo.context.sourcePlaylistId, [{ uri: trackInfo.uri }])  
        }).then(function (result) {    
            log.warn('spotify-server.js:  Removed track ' + trackInfo.name + ', ' + trackInfo.albumName + ', ' + trackInfo.artistName + ', ' + trackInfo.uri + ' from ' + trackInfo.context.sourcePlaylistName + " , " + trackInfo.context.sourcePlaylistId);
            trackInfo.result = result
            return Promise.resolve(trackInfo)
        });
}




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