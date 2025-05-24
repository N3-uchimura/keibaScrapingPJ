/**
 * globalvariables.ts
 **
 * function：global variables
**/

/** const */
// default
export namespace myConst {
  export const COMPANY_NAME: string = "nthree";
  export const APP_NAME: string = "getKeiba";
  export const LOG_LEVEL: string = "all";
  export const DEFAULT_ENCODING: string = "utf8";
  export const CSV_ENCODING: string = "SJIS";
  export const DEF_URL_QUERY: string = "&type=2&rf=shutuba_submenu";
  export const BASE_URL: string = "https://www.netkeiba.com/";
  export const HORSE_BASE_URL: string = "https://db.netkeiba.com/horse/";
  export const TRAINING_BASE_URL: string = "https://race.netkeiba.com/race/oikiri.html";
  export const SIRE_BASE_URL: string = "https://db.netkeiba.com/horse/sire/";
}

// selectors
export namespace mySelectors {
  export const BASE_SELECTOR: string = "#contents > div > table > tbody > tr:nth-child(3) >";
  export const TURF_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(13) > a`;
  export const TURF_WIN_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(14) > a`;
  export const DIRT_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(15) > a`;
  export const DIRT_WIN_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(16) > a`;
  export const TURF_DIST_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(20)`;
  export const DIRT_DIST_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(21)`;
}

// races
export namespace myRaces {
  export const TODAY_RACES: string[] = ['新潟'];
  export const TODAY_RACENOS: string[] = ['202504010702'];
  //export const TODAY_RACES: string[] = ['東京', '京都', '新潟'];
  //export const TODAY_RACENOS: string[] = ['202505020902', '202508020902', '202504010702'];
}
