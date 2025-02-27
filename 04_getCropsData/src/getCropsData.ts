/**
/* getCropsData.ts
/* getCropsData - Getting shuboba crops data from netkeiba. -
**/

"use strict";

//* Constants
const WINDOW_WIDTH: number = 1000; // window width
const WINDOW_HEIGHT: number = 1000; // window height
const DEFAULT_ENCODING: string = 'utf8'; // encoding
const TARGET_URL: string = 'https://db.netkeiba.com/horse/sire/'; // base url
const BASE_SELECTOR: string = '#contents > div > table > tbody > tr:nth-child(3) >'; // base
const TURF_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(13) > a`; // turf
const TURF_WIN_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(14) > a`; // turf win
const DIRT_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(15) > a`; // dirt
const DIRT_WIN_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(16) > a`; // dirt win
const TURF_DIST_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(20)`; // turf average distance
const DIRT_DIST_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(21)`; // dirt average distance
//* Modules
import { app, BrowserWindow } from 'electron'; // electron
import { Scrape } from './class/Scrape0120'; // scraper
import CSV from './class/ElectronCsv0211'; // aggregator
import ELLogger from './class/ELLogger0217'; // logger
import Dialog from './class/ElectronDialog0203'; // dialog
import mkdir from './class/Mkdir0126'; // mdkir

// scraper
const scraper = new Scrape();
// aggregator
const csvMaker = new CSV('SJIS');
// loggeer instance
const logger: ELLogger = new ELLogger('./logs', 'access');
// dialog
const dialogMaker: Dialog = new Dialog();
// mkdir
const mkdirManager = new mkdir();

//* interfaces
// window option
interface windowOption {
  width: number; // window width
  height: number; // window height
  defaultEncoding: string; // default encode
  webPreferences: Object; // node
}

//* General variables
// main window
let mainWindow: any = null;
// result array
let resultArray: any[] = [];
// selector array
const selectorArray: string[] = [TURF_SELECTOR, TURF_WIN_SELECTOR, DIRT_SELECTOR, DIRT_WIN_SELECTOR, TURF_DIST_SELECTOR, DIRT_DIST_SELECTOR];
// horse array
const horseDataArray: string[] = ['turf', 'turfwin', 'dirt', 'dirtwin', 'turfdistanse', 'dirtdistanse'];

// main
app.on('ready', async () => {
  // window options
  const windowOptions: windowOption = {
    width: WINDOW_WIDTH, // window width
    height: WINDOW_HEIGHT, // window height
    defaultEncoding: DEFAULT_ENCODING, // encoding
    webPreferences: {
      nodeIntegration: false, // node
    }
  }
  // Electron window
  mainWindow = new BrowserWindow(windowOptions);

  logger.info('operation started.');
  // make dir
  await mkdirManager.mkDirAll(['./logs', './output']);
  // chosen filename
  const filename: string = await csvMaker.showCSVDialog(mainWindow);
  // read csv file
  const tmpRecords: any = await csvMaker.getCsvData(filename);
  // extract first column
  const urls: string[] = tmpRecords.map((item: any) => item.urls);
  const horses: string[] = tmpRecords.map((item: any) => item.horse);

  // loop words
  for (let i: number = 0; i < urls.length; i++) {
    try {
      // empty array
      let tmpObj: any = {
        horse: '', // horse name
        turf: '', // turf ratio
        turfwin: '', // turf win
        dirt: '', // dirt ratio
        dirtwin: '', // dirt win
        turfdistanse: '', // turf average distance
        dirtdistanse: '', // dirt average distance
      };
      // insert horse name
      tmpObj.horse = horses[i];

      // goto page
      await scraper.doGo(TARGET_URL + urls[i]);
      // wait for selector
      await scraper.doWaitFor(3000);
      logger.debug(`goto ${TARGET_URL + urls[i]}`);

      // get data
      for (let j: number = 0; j < selectorArray.length; j++) {
        try {
          // check selector
          if (await scraper.doCheckSelector(selectorArray[j])) {
            // wait for selector
            await scraper.doWaitFor(200);
            // acquired data
            const scrapedData: string = await scraper.doSingleEval(selectorArray[j], 'textContent');

            // data exists
            if (scrapedData != '') {
              tmpObj[horseDataArray[j]] = scrapedData;
            }
            // wait for 100ms
            await scraper.doWaitFor(200);

          } else {
            logger.debug('no selector');
          }

        } catch (e: unknown) {
          logger.error(e);
        }
      }
      resultArray.push(tmpObj);

    } catch (e: unknown) {
      logger.error(e);
    }
  }

  // csv header
  const csvHeadObj: { [key: string]: any } = {
    horse: 'horse', // horse name
    turf: 'turf',// turf
    turfwin: 'turfwin',// urf win
    dirt: 'dirt', // dirt
    dirtwin: 'dirtwin', // dirt win
    turfdistanse: 'turfdistanse', // turf distanse
    dirtdistanse: 'dirtdistanse', // dirt distanse
  }
  // today date
  const formattedDate: string = (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 8);
  // make csv
  await csvMaker.makeCsvData(resultArray, csvHeadObj, `output/${formattedDate}.csv`)
  // end message
  dialogMaker.showmessage('info', 'completed.');
  logger.info('completed.');
  // close window
  mainWindow.close();
});

// closing
mainWindow.on('closed', () => {
  // release window
  mainWindow = null;
});
