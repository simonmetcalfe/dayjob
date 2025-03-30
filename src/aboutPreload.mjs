
/**
 * -------------------------------------------------------------------------------------------------
 * Preload
 * 
 * Controls which main process APIs are exposed to the renderer process
 * The relevent API is imported and exposed
 * -------------------------------------------------------------------------------------------------
 */

import { MyApi } from "./aboutApi.mjs";
new MyApi().expose();
