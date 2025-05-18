/**
 * globalvariables.ts
 **
 * function：global variables
**/

/** const */
// default
export namespace myConst {
  export const COMPANY_NAME = "nthree";
  export const APP_NAME = "getKeiba";
  export const LOG_LEVEL = "info";
  export const DEFAULT_ENCODING = "utf8";
  export const CSV_ENCODING = "SJIS";
  export const DEF_URL_QUERY = "&type=2&rf=shutuba_submenu";
  export const BASE_URL = "https://www.netkeiba.com/";
  export const HORSE_BASE_URL = "https://db.netkeiba.com/horse/";
  export const TRAINING_BASE_URL = "https://race.netkeiba.com/race/oikiri.html";
  export const SIRE_BASE_URL = "https://db.netkeiba.com/horse/sire/";
}

// selectors
export namespace mySelectors {
  export const BASE_SELECTOR = "#contents > div > table > tbody > tr:nth-child(3) >";
  export const TURF_SELECTOR = `${BASE_SELECTOR} td:nth-child(13) > a`;
  export const TURF_WIN_SELECTOR = `${BASE_SELECTOR} td:nth-child(14) > a`;
  export const DIRT_SELECTOR = `${BASE_SELECTOR} td:nth-child(15) > a`;
  export const DIRT_WIN_SELECTOR = `${BASE_SELECTOR} td:nth-child(16) > a`;
  export const TURF_DIST_SELECTOR = `${BASE_SELECTOR} td:nth-child(20)`;
  export const DIRT_DIST_SELECTOR = `${BASE_SELECTOR} td:nth-child(21)`;
}

