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

    playlists = {}; // Store the playlists
    
    // Create an object for each interactive HTML element
    fldClientId;
    fldClientSecret;
    btnOpenDashboard;
    btnConnectToSpotify;
    fldPlaylistLink = [];
    fldPlaylistName = [];
    chkAlwaysMoveTracks;
    chkAlwaysMoveTracks;
    
    start() {
        console.log("ui-preferencesView.mjs: Start");
        this.bindElements();
        this.getAllPrefs();
    }

    bindElements() {
        // Bind the objects to the HTML elements
        this.fldClientId = document.getElementById('fldClientId');
        this.fldClientSecret = document.getElementById('fldClientSecret');
        this.btnOpenDashboard = document.getElementById('btnOpenDashboard');
        this.btnConnectToSpotify = document.getElementById('btnConnectToSpotify');
        this.chkAlwaysSkipTracks = document.getElementById('chkAlwaysSkipTracks');
        this.chkAlwaysMoveTracks = document.getElementById('chkAlwaysMoveTracks'); 

        // Log if binding was not successful
        console.assert(this.fldClientId); 
        console.assert(this.fldClientSecret);
        console.assert(this.btnOpenDashboard);
        console.assert(this.btnConnectToSpotify);
        console.assert(this.chkAlwaysSkipTracks);
        console.assert(this.chkAlwaysMoveTracks);
        
        // Add event listeners for buttons
        this.btnOpenDashboard.addEventListener('click', (event) => this.buttonPress(event.target.id));
        this.btnConnectToSpotify.addEventListener('click', (event) => this.buttonPress(event.target.id));

        // Add event listeners for text fields
        this.fldClientId.addEventListener('input', (event) => {window.myApi.setPref('spotify-server_clientId', event.target.value);});
        this.fldClientSecret.addEventListener('input', (event) => {window.myApi.setPref('spotify-server_clientSecret', event.target.value);});

        // Add event listeners for checkboxes
        this.chkAlwaysSkipTracks.addEventListener('input', (event) => {window.myApi.setPref('dayjob_always_skip_tracks', event.target.checked);});
        this.chkAlwaysMoveTracks.addEventListener('input', (event) => {window.myApi.setPref('dayjob_always_move_tracks', event.target.checked);});

        // Bind and add event listeners for all playlist fields in a loop
        for (let i = 0; i < 10; i++) {
            // playlistLink
            let element = document.getElementById(`fldPlaylistLink${i+1}`);
            console.assert(element, `Element with id 'fldPlaylistLink${i+1}' not found`);
            element.addEventListener('input', (event) => this.setPlaylistLink(i, event.target.value));
            this.fldPlaylistLink.push(element);
            
            // playlistName
            element = document.getElementById(`fldPlaylistName${i+1}`);
            console.assert(element, `Element with id 'fldPlaylistName${i+1}' not found`);
            element.addEventListener('input', (event) => this.setPlaylistName(i, event.target.value));
            this.fldPlaylistName.push(element); 
        }
    }

    onUpdateUi(uiData){
        //this.resetUi();
    }

    buttonPress(data) {
        console.log("MyView: Button pressed: " + data);
        window.myApi.buttonPress(data); 
    }

    getAllPrefs(){
        window.myApi.getPref('spotify-server_clientId', (result) => {if(result != undefined){this.fldClientId.value = result}});
        window.myApi.getPref('spotify-server_clientSecret', (result) => {if(result != undefined){this.fldClientSecret.value = result}});
        window.myApi.getPref('dayjob_always_skip_tracks', (result) => {if(result != undefined){this.chkAlwaysSkipTracks.checked = result}}); 
        window.myApi.getPref('dayjob_always_move_tracks', (result) => {if(result != undefined){this.chkAlwaysMoveTracks.checked = result}});
        window.myApi.getPref('dayjob_playlists_v1', (result) => {
            if(result != undefined){
                this.playlists = result;
                if (this.playlists != undefined){
                    for (let i = 0; i < 10; i++) {
                        this.fldPlaylistLink[i].value = this.playlists[i].playlistUri;
                        this.fldPlaylistName[i].value = this.playlists[i].playlistName;
                    }
                }
            }
        });
    }

    setPlaylistLink(id, value){
        console.log("MyView: Playlist link " + id + " field changed: " + value);
        console.log(JSON.stringify(this.playlists));
        this.playlists[id].playlistUri = value;
        window.myApi.setPlaylists(this.playlists);  // Every time  key is pressed, save all playlists! 
    }

    setPlaylistName(id, value){
        console.log("MyView: Playlist name " + id + " field changed: " + value);
        this.playlists[id].playlistName = value;
        window.myApi.setPlaylists(this.playlists);  // Every time  key is pressed, save all playlists! 
    }



}

