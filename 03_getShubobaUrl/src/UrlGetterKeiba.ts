/**
/* UrlGetterKeiba.ts
/* UrlGetterKeiba - Getting horse url -
**/

"use strict";

//* Constants
const WINDOW_WIDTH: number = 1000; // window width
const WINDOW_HEIGHT: number = 1000; // window height
const DEFAULT_ENCODING: string = 'utf8'; // encoding
const TARGET_URL: string = 'https://www.netkeiba.com/'; // base url

//* Modules
import { app, BrowserWindow } from 'electron'; // electron
import * as fs from 'fs'; // fs
import * as path from 'path'; // path
import { Scrape } from './class/Scrape1102'; // custom Scraper
import CSV from './class/ElectronCsv1111'; // aggregator

// aggregator
const csvMaker = new CSV('SJIS');

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

// scraper
const scraper = new Scrape();

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

    // output dir
    const outputDirPath: string = path.join(__dirname, 'output');
    // if exists make dir
    if (!fs.existsSync(outputDirPath)) {
      fs.promises.mkdir(outputDirPath).then((): void => {
        console.log('Directory created successfully');
      }).catch((): void => {
        console.log('failed to create directory');
      });
    }
    // file reading
    const filename: string = await csvMaker.showCSVDialog(mainWindow);
    // get data
    const tmpRecords: any = await csvMaker.getCsvData(filename);
    // horse names
    const records: string[] = tmpRecords.map((item: any) => item[0]);

    // goto page
    await scraper.doGo(TARGET_URL);
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
        console.log(e);
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
    // close window
    mainWindow.close();

    // closing
    mainWindow.on('closed', () => {
      // release window
      mainWindow = null;
    });

  } catch (e: unknown) {
    // show error dialog
    console.log('export error', 'error occured when exporting csv.', e, true);
  }
});