/**
 * -------------------------------------------------------------------------------------------------
 * Name:         prefs.cjs
 * Description:  Module for managing default, loading and saving 
 *               of preferences using 'electron-store'
 *               
 * Author:       Simon Metcalfe
 * -------------------------------------------------------------------------------------------------
 */

/**
 * -------------------------------------------------------------------------------------------------
 * Modules
 * -------------------------------------------------------------------------------------------------
 */

import Store from 'electron-store';
import log from 'electron-log';

/**
 * -------------------------------------------------------------------------------------------------
 * Init preferences storage 
 * -------------------------------------------------------------------------------------------------
 */

const prefs_local = new Store({
    name : 'dayjob_prefs_local',
  });

// Test read and write
log.warn('prefs.cjs:  Loaded preferences module, last initialised on ' + prefs_local.get('date_last_init'));
prefs_local.set('date_last_init', Date.now());
log.warn('prefs.cjs:  Updated last initalised date to ' + prefs_local.get('date_last_init'));

/**
 * -------------------------------------------------------------------------------------------------
 * Save preferences
 * -------------------------------------------------------------------------------------------------
 */

export function setPref(key, val) {
    log.warn('prefs.cjs:  Updated preference: ' + key) // + ':' + prefs_local.get(key) + ' to ' + val) ;
    prefs_local.set(key, val);
}

/**
 * -------------------------------------------------------------------------------------------------
 * Get preferences
 * -------------------------------------------------------------------------------------------------
 */

export function getPref(key) {
    if (prefs_local.has(key)){
        var val = prefs_local.get(key);
        log.warn('prefs.cjs:  Retrieved preference: ' + key) // + ':' + val);
        return val; 
    }
    else {
        log.warn('prefs.cjs:  Requested key not found: ' + key) 
        return undefined;
    }

}
/**
 * -------------------------------------------------------------------------------------------------
 * Delete preferences
 * -------------------------------------------------------------------------------------------------
 */
    
export function deletePref(key) {
    prefs_local.delete(key);
    log.warn('prefs.cjs:  Deleted preference: ' + key);
}