/**
/* UrlGetterKeiba.ts
/* UrlGetterKeiba - Getting horse url -
**/

"use strict";

//* Constants
const APP_NAME: string = 'UrlGetterKeiba'; // app name
const WINDOW_WIDTH: number = 1000; // window width
const WINDOW_HEIGHT: number = 1000; // window height
const DEFAULT_ENCODING: string = 'utf8'; // encoding
const CSV_ENCODING: string = 'SJIS'; // csv encoding
const TARGET_URL: string = 'https://www.netkeiba.com/'; // base url

//* Modules
import { app, BrowserWindow } from 'electron'; // electron
import { Scrape } from './class/ElScrape0301'; // custom Scraper
import ELLogger from './class/ElLogger'; // logger
import Dialog from './class/ElDialog0301'; // dialog
import mkdir from './class/ElMkdir0301'; // mdkir
import CSV from './class/ElCsv0301'; // aggregator

// scraper
const scraper = new Scrape(APP_NAME);
// aggregator
const csvMaker = new CSV(CSV_ENCODING, APP_NAME);
// mkdir
const mkdirManager = new mkdir(APP_NAME);
// dialog
const dialogMaker: Dialog = new Dialog(APP_NAME);
// loggeer instance
const logger: ELLogger = new ELLogger(APP_NAME, "main");

//* Interfaces
// window options
interface windowOption {
  width: number; // window width
  height: number; // window height
  defaultEncoding: string; // default encode
  webPreferences: Object; // node
}

// csv headers
interface Csvheaders {
  key: string; // key
  header: string; // header
}

//* General variables
let mainWindow: any = null; // main window
let resultArray: any[] = []; // result array

// header array
const headerObjArray: Csvheaders[] = [
  { key: 'a', header: 'horse' }, // horse name
  { key: 'b', header: 'url' }, // url
];

// main
app.on('ready', async () => {
  try {
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

    // make dir
    await mkdirManager.mkDirAll(['./logs', './output', './build']);
    logger.info('makedir completed.');
    // file reading
    const filename: string = await csvMaker.showCSVDialog(mainWindow);
    // get data
    const tmpRecords: any = await csvMaker.getCsvData(filename);
    // horse names
    const records: string[] = tmpRecords.map((item: any) => item[0]);

    // goto page
    await scraper.doGo(TARGET_URL);
    logger.info(`scraping ${TARGET_URL}...`);
    // wait for loading
    await scraper.doWaitFor(3000);

    // loop words
    for (const rd of records) {
      try {
        // input word
        await scraper.doType('.Txt_Form', rd);
        // click submit button
        await scraper.doClick('.Submit_Btn');
        // wait for loading
        await scraper.doWaitFor(2000);
        // get urls
        const tmpUrl = await scraper.getUrl();
        // url exists
        if (tmpUrl && tmpUrl != '') {
          resultArray.push({ a: rd, b: tmpUrl.replace('https://db.netkeiba.com/horse/', '') });
        }

      } catch (e: unknown) {
        logger.error(e);
        // goto page
        await scraper.doGo(TARGET_URL);
        // wait for loading
        await scraper.doWaitFor(3000);
      }
    }
    // stringify option
    const stringifyOptions: { [key: string]: any } = {
      header: true, // head mode
      columns: headerObjArray,
    }
    // format date
    const formattedDate: string = (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 14);
    // make csv data
    await csvMaker.makeCsvData(resultArray, stringifyOptions, formattedDate);
    // end message
    dialogMaker.showmessage('info', 'completed.');
    logger.info('completed.');
    // close window
    mainWindow.close();

    // closing
    mainWindow.on('closed', () => {
      // release window
      mainWindow = null;
    });

  } catch (e: unknown) {
    // show error dialog
    logger.error(e);
  }
});