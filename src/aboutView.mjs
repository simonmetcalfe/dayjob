/**
 * -------------------------------------------------------------------------------------------------
 * View
 * 
 * Creates an object for each HTML element which is interactive, and binds the HTML element
 * to the objects
 * 
 * Contains functions for both firing events to the backend API, and receiving from the API
 * -------------------------------------------------------------------------------------------------
 */

export class MyView {
    
    constructor() {
        // Bind the local functins to the API calls which they are triggered by 
        //NONE
    }
    
    // Create an object for each interactive HTML element
    version;
    versionNode;
    versionChrome;
    versionElectron;

    start() {
        console.log("aboutView.mjs: Start");
        this.bindElements();
        this.updateModuleVersions();
        this.getVersionInfo();
        this.activateExternalLinks();
    }
    bindElements() {
        // Bind the objects to the HTML elements
        this.version =  document.getElementById('version');
        this.versionNode = document.getElementById('versionNode');
        this.versionChrome = document.getElementById('versionChrome');
        this.versionElectron = document.getElementById('versionElectron');

        // Add event listeners for buttons
        //NONE

        // Log if binding was not successful
        console.assert(this.version);
        console.assert(this.versionNode);
        console.assert(this.versionChrome);
        console.assert(this.versionElectron);         
    }

    updateModuleVersions(){
        this.versionNode.innerHTML = window.myApi.node();
        this.versionChrome.innerHTML = window.myApi.chrome();
        this.versionElectron.innerHTML = window.myApi.electron();
    }   
        
    activateExternalLinks(){
        // Add event listeners to all external links so they open via API in external browser
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('a.external').forEach((link) => {
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    window.myApi.openExternal(link.href); 
                });
            });
        });
    }

    getVersionInfo() {
        console.log("MyView: Getting version info.");
        window.myApi.getVersionInfo("getVersionInfo", (result) => {this.version.innerHTML = result.appVersion});        
    }
}

