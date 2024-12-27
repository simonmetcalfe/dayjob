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
        window.myApi.onUpdateUi((value) => this.onUpdateUi(value));
    }
    
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
        console.log("MyView: Start");
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
        this.pingResultSpan = document.getElementById('pingResultSpan'); //TODO: Delete me
        
        // Add event listeners for buttons
        this.buttonCta.addEventListener("click", () => this.ping());

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
        console.assert(this.pingResultSpan); //TODO: Delete me        
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
        //buttonCta.style.display = 'none';
    }

    onUpdateUi(uiData){
        this.resetUi();
        //TODO:  log.warn('Notification.js:  updateUI has received the following uiData JSON: ' + JSON.stringify(uiData));
        if (uiData.hasOwnProperty('title') && !uiData.hasOwnProperty('errorType')){
            title.innerHTML = uiData.title;
            title.style.display = 'block';
            // Title is never hidden, so calling .style.display is not required
        }
        if (uiData.hasOwnProperty('title') && uiData.hasOwnProperty('errorType') && uiData.errorType == 'warning' ){
            warning.innerHTML = uiData.title;
            warning.style.display = 'block';
        }
        if (uiData.hasOwnProperty('title') && uiData.hasOwnProperty('errorType') && uiData.errorType == 'error' ){
            error.innerHTML = uiData.title;
            error.style.display = 'block';
        }
        if (uiData.hasOwnProperty('description')){
            description.innerHTML = uiData.description;
            description.style.display = 'block';
        }    
        if (uiData.hasOwnProperty('actionAdd')){
            actionAdd.innerHTML = uiData.actionAdd;
            actionAdd.style.display = 'block';
        }
        if (uiData.hasOwnProperty('actionRemove')){
            actionRemove.innerHTML = uiData.actionRemove;
            actionRemove.style.display = 'block';
        }
        if (uiData.hasOwnProperty('actionWarning')){
            actionWarning.innerHTML = uiData.actionWarning;
            actionWarning.style.display = 'block';
        }
        if (uiData.hasOwnProperty('actionError')){
            actionError.innerHTML = uiData.actionError;
            actionError.style.display = 'block';
        }
        if (uiData.hasOwnProperty('subDescription')){
            subDescription.innerHTML = uiData.subDescription;
            subDescription.style.display = 'block';
        }   
        if (uiData.hasOwnProperty('buttonCta') && !uiData.buttonCta.action == ''){
            buttonCta.innerHTML = uiData.buttonCta.title;
            buttonCta.style.display = 'inline-block';
        }
    }

    
    ping() {
        console.log("MyView: Ping button clicked.");
        window.myApi.ping("Ping", (result) => {this.pingResultSpan.textContent = result});
    }

    onPing(result) {
        console.log("MyView: Received result from API: " + result);
        this.pingResultSpan.textContent = result;
    }
    
}

