///////////////////////////////////////////////////////////////////
//// Name:         spotify-audiocontrol.js
//// Description:  A module for controlling the audio playback of
////               Spotify desktop client's (OSX support only).
////               
//// Version:      0.0.1
//// Author:       Simon Metcalfe
///////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////
//// Modules
///////////////////////////////////////////////////////////////////

const exec = require('child_process').exec;
var log = require('electron-log');

///////////////////////////////////////////////////////////////////
//// Playback commands
///////////////////////////////////////////////////////////////////

/*
// Not functional - Needs to be updated to be passed track length information
module.exports.seek = function(percent) {
  var time = (percent / 100) * track.length;
  exec('osascript -e \'tell application "Spotify" to set player position to ' + time + '\'');
};
*/

module.exports.pause = function(pause) {
    log.warn('spotify-audiocontrol.js:  Sent pause request (OSX) to Spotify with value: ' + pause);
    exec('osascript -e \'tell application "Spotify" to ' + pause ? 'pause' : 'play' + '\'');
};

module.exports.playpause = function() {
    log.warn('spotify-audiocontrol.js:  Sent play/pause request (OSX) to Spotify');
    exec('osascript -e \'tell application "Spotify" to playpause\'');
};

module.exports.nextTrack = function() {
    log.warn('spotify-audiocontrol.js:  Sent next track request (OSX) to Spotify');
    exec('osascript -e \'tell application "Spotify" to ' + ('next' ? 'next' : 'previous') + ' track\'');
};

module.exports.prevTrack = function() {
    log.warn('spotify-audiocontrol.js:  Sent prev track request (OSX) to Spotify');
    exec('osascript -e \'tell application "Spotify" to ' + ('previous' ? 'next' : 'previous') + ' track\'');
  };

module.exports.repeat = function(repeating) {
    log.warn('spotify-audiocontrol.js:  Sent repeat request (OSX) to Spotify with value: ' + pause);
    exec('osascript -e \'tell application "Spotify" to set repeating to ' + repeating + '\'');
};

module.exports.shuffle = function(shuffle) {
    log.warn('spotify-audiocontrol.js:  Sent shuffle request (OSX) to Spotify with value: ' + pause);
    exec('osascript -e \'tell application "Spotify" to set shuffling to ' + shuffle + '\'');
};


