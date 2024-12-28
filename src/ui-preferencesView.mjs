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

    }
    
    // Create an object for each interactive HTML element
    fldClientId;
    fldClientSecret;
    btnOpenDashboard;
    btnConnectToSpotify;
    //fldPlaylist = Array(10).fill(null);
    //fldPlaylistName = Array(10).fill(null);
    always_skip_tracks;
    always_move_tracks;
    
    start() {
        console.log("ui-preferencesView.mjs: Start");
        this.bindElements();
    }

    bindElements() {
        // Bind the objects to the HTML elements
        this.fldClientId = document.getElementById('fldClientId');
        this.fldClientSecret = document.getElementById('fldClientSecret');
        this.btnOpenDashboard = document.getElementById('btnOpenDashboard');
        this.btnConnectToSpotify = document.getElementById('btnConnectToSpotify');
        //this.fldPlaylist
        //this.fldPlaylistName
        this.always_skip_tracks = document.getElementById('always_skip_tracks');
        this.always_move_tracks = document.getElementById('always_move_tracks'); 

        // Log if binding was not successful
        console.assert(this.fldClientId); 
        console.assert(this.fldClientSecret);
        console.assert(this.btnOpenDashboard);
        console.assert(this.btnConnectToSpotify);
        console.assert(this.always_skip_tracks);
        console.assert(this.always_move_tracks);
        
        // Add event listeners for buttons
        this.btnOpenDashboard.addEventListener('click', (event) => this.buttonPress(event.target.id));
        this.btnConnectToSpotify.addEventListener('click', (event) => this.buttonPress(event.target.id));

        //this.fldClientId.addEventListener('input', (event) => {console.log(event.target.value);});
        // Add event listeners for editing text fields
        this.fldClientId.addEventListener('input', (event) => {window.myApi.setPref('spotify-server_clientId', event.target.value);});
        this.fldClientSecret.addEventListener('input', (event) => {window.myApi.setPref('spotify-server_clientSecret', event.target.value);});

        this.always_skip_tracks.addEventListener('input', (event) => {window.myApi.setPref('dayjob_always_skip_tracks', event.checked);});
        this.always_move_tracks.addEventListener('input', (event) => {window.myApi.setPref('dayjob_always_move_tracks', event.checked);});


    
    }

    onUpdateUi(uiData){
        //this.resetUi();
    }

    buttonPress(data) {
        console.log("MyView: Button pressed: " + data);
        window.myApi.buttonPress(data); 
    }

}

