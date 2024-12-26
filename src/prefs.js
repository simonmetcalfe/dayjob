/**
 * -----------------------------------------------------------------
 * Name:         prefs.js
 * Description:  Module for managing default, loading and saving 
 *               of preferences using 'electron-store'
 *               
 * Author:       Simon Metcalfe
 * -----------------------------------------------------------------
 */

/**
 * -----------------------------------------------------------------
 * Modules
 * -----------------------------------------------------------------
 */

const log = import('electron-log');
let Store;
let prefs_local;

/**
 * -----------------------------------------------------------------
 *  Init preferences storage 
 * -----------------------------------------------------------------
 */

// Initialize store using async IIFE
(async () => {
    const { default: ElectronStore } = await import('electron-store');
    Store = ElectronStore;
    prefs_local = new Store({
        name: 'dayjob_prefs_local',
    });


    // Test read and write
    log.warn('prefs.js:  Loaded preferences module, last initialised on ' + prefs_local.get('date_last_init'));
    prefs_local.set('date_last_init', Date.now());
    log.warn('prefs.js:  Updated last initalised date to ' + prefs_local.get('date_last_init'));
})();

/**
 * -----------------------------------------------------------------
 *  Save preferences
 * -----------------------------------------------------------------
 */

module.exports.setPref = async function(key, val) {
    // Ensure store is initialized
    if (!prefs_local) {
        const { default: ElectronStore } = await import('electron-store');
        Store = ElectronStore;
        prefs_local = new Store({
            name: 'dayjob_prefs_local',
        });
    }
    
    log.warn('prefs.js:  Updated preference: ' + key);
    prefs_local.set(key, val);
}

/**
 * -----------------------------------------------------------------
 *  Get preferences
 * -----------------------------------------------------------------
 */

module.exports.getPref = async function(key) {
    // Ensure store is initialized
    if (!prefs_local) {
        const { default: ElectronStore } = await import('electron-store');
        Store = ElectronStore;
        prefs_local = new Store({
            name: 'dayjob_prefs_local',
        });
    }

    if (prefs_local.has(key)) {
        var val = prefs_local.get(key);
        log.warn('prefs.js:  Retrieved preference: ' + key);
        return val;
    }
    else {
        log.warn('prefs.js:  Requested key not found: ' + key);
        return undefined;
    }
}

/**
 * -----------------------------------------------------------------
 *  Delete preferences
 * -----------------------------------------------------------------
 */
    
module.exports.deletePref = async function(key) {
    // Ensure store is initialized
    if (!prefs_local) {
        const { default: ElectronStore } = await import('electron-store');
        Store = ElectronStore;
        prefs_local = new Store({
            name: 'dayjob_prefs_local',
        });
    }

    prefs_local.delete(key);
    log.warn('prefs.js:  Deleted preference: ' + key);
}