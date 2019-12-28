///////////////////////////////////////////////////////////////////
//// Name:         prefs.js
//// Description:  Module for managing default, loading and saving 
////               of preferences using 'electron-store'
////               
//// Author:       Simon Metcalfe
///////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////
//// Modules
///////////////////////////////////////////////////////////////////

const Store = require('electron-store');
var log = require('electron-log');

///////////////////////////////////////////////////////////////////
////  Variables
///////////////////////////////////////////////////////////////////

// Define all defaults here, they will be used when a key did not previously exist
defaults = {
    defaltkey : 'defaultval'
}

///////////////////////////////////////////////////////////////////
////  Init preferences storage 
///////////////////////////////////////////////////////////////////

const prefs_local = new Store({
    name : 'dayjob_prefs_local',
  });

// Test read and write
log.warn('prefs.js:  Loaded preferences module, last initialised on ' + prefs_local.get('date_last_init'));
prefs_local.set('date_last_init', Date.now());
log.warn('prefs.js:  Updated last initalised date to ' + prefs_local.get('date_last_init'));

///////////////////////////////////////////////////////////////////
////  Save preferences
///////////////////////////////////////////////////////////////////

module.exports.setPref = function(key, val){
    log.warn('prefs.js:  Updated preference: ' + key) // + ':' + prefs_local.get(key) + ' to ' + val) ;
    prefs_local.set(key, val);
}

///////////////////////////////////////////////////////////////////
////  Get preferences
///////////////////////////////////////////////////////////////////

module.exports.getPref  = function(key){
    if (prefs_local.has(key)){
        var val = prefs_local.get(key);
        log.warn('prefs.js:  Retrieved preference: ' + key) // + ':' + val);
        return val; 
    }
    /* 
    else if (key is in defaults key val storage) {
        // Save the default preference
        prefs_local.set(key, ????????);
        log.warn('prefs.js:  Retrieved and saved default preference: ' + key + ':' + val) 
        return prefs_local.get(key);
    }
    */
    else {
        log.warn('prefs.js:  Requested key not found: ' + key) 
        return undefined;
    }

}
///////////////////////////////////////////////////////////////////
////  Delete preferences
///////////////////////////////////////////////////////////////////
    
module.exports.deletePref = function(key){
    prefs_local.delete(key);
    log.warn('prefs.js:  Deleted preference: ' + key);
}