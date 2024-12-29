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

/**
 * -----------------------------------------------------------------
 * Example uiData JSON Object
 * -----------------------------------------------------------------
 */

/*
uiData = {
    title: 'The title',
    description: 'The dialog box message',
    subDescription: 'The small text',
    actionAdd:'Adding this track', 
    actionRemove:'Removing this track', 
    actionWarning:'This is a warning',
    actionError:'This is an error',
    buttonCta: {
        title: 'The button title',
        action: 'the_button_action'
    },
    errorType: 'error'
}
*/ 

export class MyView {
    constructor() {
        // Bind the local functins to the API calls which they are triggered by 
        window.myApi.onUpdateUi((value) => this.onUpdateUi(value));
    }

    uiData;
    // Create an object for each interactive HTML element
    title;
    description;
    warning;
    error;
    actionAdd;
    actionRemove;
    actionWarning;
    actionError;
    subDescription;
    buttonCta;
    pingResultSpan; //TODO: delete me
    
    start() {
        console.log("notificationView.mjs: Start");
        this.bindElements();
        this.resetUi(); // Reset the UI on startup (saves hiding everything in CSS)
    }
    bindElements() {
        // Bind the objects to the HTML elements
        this.title = document.getElementById('title');
        this.description = document.getElementById('description');
        this.warning = document.getElementById('warning');
        this.error = document.getElementById('error');
        this.actionAdd = document.getElementById('actionAdd');
        this.actionRemove = document.getElementById('actionRemove');
        this.actionWarning = document.getElementById('actionWarning');
        this.actionError = document.getElementById('actionError');
        this.subDescription = document.getElementById('subDescription');        
        this.buttonCta = document.getElementById('buttonCta');
        
        // Add event listeners for buttons
        this.buttonCta.addEventListener("click", (event) => this.onDynamicButtonPress());

        // Log if binding was not successful
        console.assert(this.title);
        console.assert(this.description);
        console.assert(this.warning);
        console.assert(this.error);
        console.assert(this.actionAdd);
        console.assert(this.actionRemove);
        console.assert(this.actionWarning);
        console.assert(this.actionError);
        console.assert(this.subDescription);
        console.assert(this.buttonCta);     
    }

    resetUi(){
        title.style.display = 'none';
        description.style.display = 'none';
        warning.style.display = 'none';
        error.style.display = 'none';
        actionAdd.style.display = 'none';
        actionRemove.style.display = 'none';
        actionWarning.style.display = 'none';
        actionError.style.display = 'none';
        subDescription.style.display = 'none';
        buttonCta.style.display = 'none';
    }

    onUpdateUi(uiData){
        this.resetUi();
        this.uiData = uiData; //Store so it is accessible by onDynamicButtonPress
        
        if (uiData.hasOwnProperty('title') && !uiData.hasOwnProperty('errorType')){
            this.title.innerHTML = uiData.title;
            this.title.style.display = 'block';
            // Title is never hidden, so calling .style.display is not required
        }
        if (uiData.hasOwnProperty('title') && uiData.hasOwnProperty('errorType') && uiData.errorType == 'warning' ){
            this.warning.innerHTML = uiData.title;
            this.warning.style.display = 'block';
        }
        if (uiData.hasOwnProperty('title') && uiData.hasOwnProperty('errorType') && uiData.errorType == 'error' ){
            this.error.innerHTML = uiData.title;
            this.error.style.display = 'block';
        }
        if (uiData.hasOwnProperty('description')){
            this.description.innerHTML = uiData.description;
            this.description.style.display = 'block';
        }    
        if (uiData.hasOwnProperty('actionAdd')){
            this.actionAdd.innerHTML = uiData.actionAdd;
            this.actionAdd.style.display = 'block';
        }
        if (uiData.hasOwnProperty('actionRemove')){
            this.actionRemove.innerHTML = uiData.actionRemove;
            this.actionRemove.style.display = 'block';
        }
        if (uiData.hasOwnProperty('actionWarning')){
            this.actionWarning.innerHTML = uiData.actionWarning;
            this.actionWarning.style.display = 'block';
        }
        if (uiData.hasOwnProperty('actionError')){
            this.actionError.innerHTML = uiData.actionError;
            this.actionError.style.display = 'block';
        }
        if (uiData.hasOwnProperty('subDescription')){
            this.subDescription.innerHTML = uiData.subDescription;
            this.subDescription.style.display = 'block';
        }   
        if (uiData.hasOwnProperty('buttonCta') && !uiData.buttonCta.action == ''){
            this.buttonCta.innerHTML = uiData.buttonCta.title;
            this.buttonCta.style.display = 'inline-block';
        }
    }
    
    onDynamicButtonPress(data) {
        if (this.uiData.buttonCta != undefined && this.uiData.buttonCta != null){
            let dynamicAction = this.uiData.buttonCta.action; // Look up the button's current action in uiData
            console.log("MyView: Dynamic button pressed with action: " + dynamicAction);
            window.myApi.buttonPress(dynamicAction); 
        }
    }    
}

