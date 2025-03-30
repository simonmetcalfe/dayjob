
/**
 * -------------------------------------------------------------------------------------------------
 * Preload
 * 
 * Controls which main process APIs are exposed to the renderer process
 * The relevent API is imported and exposed
 * -------------------------------------------------------------------------------------------------
 */

import { MyApi } from "./ui-preferencesApi.mjs";
new MyApi().expose();
