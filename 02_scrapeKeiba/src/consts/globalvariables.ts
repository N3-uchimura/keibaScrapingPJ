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
  export const LOG_LEVEL: string = "info";
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
  export const RACES: any = {
    '札幌': '01',
    '函館': '02',
    '福島': '03',
    '新潟': '04',
    '東京': '05',
    '中山': '06',
    '中京': '07',
    '京都': '08',
    '阪神': '09',
    '小倉': '10',
  };
  export const RACES_EN: any = {
    'Sapporo': '01',
    'Hakodate': '02',
    'Fukushima': '03',
    'Niigata': '04',
    'Tokyo': '05',
    'Nakayama': '06',
    'Chukyo': '07',
    'Kyoto': '08',
    'Hanshin': '09',
    'Kokura': '10',
  };
  export const EAST_RACES: string[] = ['東京', '中山'];
  export const WEST_RACES: string[] = ['京都', '阪神'];
  export const LOCAL_RACES: string[] = ['札幌', '函館', '福島', '新潟', '中京', '小倉'];
  export const EAST_RACES_EN: string[] = ['Tokyo', 'Nakayama'];
  export const WEST_RACES_EN: string[] = ['Kyoto', 'Hanshin'];
  export const LOCAL_RACES_EN: string[] = ['Sapporo', 'Hakodate', 'Fukushima', 'Niigata', 'Chukyo', 'Kokura'];
  export const TODAY_RACES: string[] = ['東京', '京都', '新潟'];
  export const TODAY_RACENOS: string[] = ['202505021001', '202508021001', '202504010801'];
}
