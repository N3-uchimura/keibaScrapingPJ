/**
/* getCropsData.ts
/* getCropsData - Getting shuboba crops data. -
**/

"use strict";

//* Constants
const WINDOW_WIDTH: number = 1000; // window width
const WINDOW_HEIGHT: number = 1000; // window height
const DEFAULT_ENCODING: string = 'utf8'; // encoding
const CSV_ENCODING: string = 'Shift_JIS'; // csv encoding
const TARGET_URL: string = 'https://db.netkeiba.com/horse/sire/'; // base url
const BASE_SELECTOR: string = '#contents > div > table > tbody > tr:nth-child(3) >'; // base
const TURF_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(13) > a`; // turf
const TURF_WIN_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(14) > a`; // turf win
const DIRT_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(15) > a`; // dirt
const DIRT_WIN_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(16) > a`; // dirt win
const TURF_DIST_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(20)`; // turf average distance
const DIRT_DIST_SELECTOR: string = `${BASE_SELECTOR} td:nth-child(21)`; // dirt average distance
//* Modules
import { app, BrowserWindow, dialog, MessageBoxOptions } from 'electron'; // electron
import * as fs from 'fs'; // fs
import * as path from 'path'; // path
import parse from 'csv-parse/lib/sync'; // csv parser
import stringifySync from 'csv-stringify/lib/sync'; // csv stfingifier
import iconv from 'iconv-lite'; // Ttext converter
import { Scrape } from './class/Scrape1102'; // scraper
import { FileFilter } from 'electron/main'; // file filter

//* interfaces
// window option
interface windowOption {
  width: number; // window width
  height: number; // window height
  defaultEncoding: string; // default encode
  webPreferences: Object; // node
}

// tmp records
interface parseRecords {
  columns: string[]; // columns
  from_line: number; // line start
}

// csv stringify option
interface csvStringify {
  header: boolean; // header
  columns: csvHeaders; // columns
}

// csv dialog option
interface csvDialog {
  properties: any; // file open
  title: string; // header title
  defaultPath: string; // default path
  filters: FileFilter[]; // filter
}

// records
interface csvRecords {
  urls: string; // url
  horse: string; // horse name
}

// headers
interface csvHeaders {
  horse: string; // horse name
  turf: string; // turf
  turfwin: string; // urf win
  dirt: string; // dirt
  dirtwin: string; // dirt win
  turfdistanse: string; // turf distanse
  dirtdistanse: string; // dirt distanse
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

// scraper
const scraper = new Scrape();

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

  // csv file dialog
  const promise: Promise<string> = new Promise((resolve, reject) => {
    // get csv
    getCsvData()
      // success
      .then((res: string[]) => {
        // chosen filename
        const filename: string = res[0];
        // resolved
        resolve(filename);
      })

      // error
      .catch((e: unknown) => {
        // error
        outErrorMsg(e, 1);
        // error message
        showDialog('no file', 'no csv file selected', e, true);
        // rejected
        reject();
        // close window
        mainWindow.close();
      });
  });

  // file reading
  promise.then((name: string) => {
    try {
      // read file
      fs.readFile(name, async (err: any, data: any) => {
        // error
        if (err) throw err;

        // initialize
        await scraper.init();
        console.log(`scraping ${name}..`);

        // decoder
        const str: string = iconv.decode(data, CSV_ENCODING);
        // format date
        const formattedDate: string = (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 14);

        // options
        const recordOptions: parseRecords = {
          columns: ['horse', 'urls'], // column
          from_line: 2, // from line 2
        }
        // csv reading
        const tmpRecords: csvRecords[] = parse(str, recordOptions);
        // extract first column
        const urls: string[] = tmpRecords.map(item => item.urls);
        const horses: string[] = tmpRecords.map(item => item.horse);

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
            console.log(`goto ${TARGET_URL + urls[i]}`);
            // wait for selector
            await scraper.doWaitFor(3000);

            // get data
            for (let j: number = 0; j < selectorArray.length; j++) {
              try {
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
                  console.log('no selector');
                }

              } catch (e: unknown) {
                console.log(e);
              }
            }
            console.log(tmpObj);
            resultArray.push(tmpObj);

          } catch (e: unknown) {
            console.log(e);
          }
        }

        console.log(resultArray);

        const csvHeadObj: csvHeaders = {
          horse: 'horse', // horse name
          turf: 'turf',// turf
          turfwin: 'turfwin',// urf win
          dirt: 'dirt', // dirt
          dirtwin: 'dirtwin', // dirt win
          turfdistanse: 'turfdistanse', // turf distanse
          dirtdistanse: 'dirtdistanse', // dirt distanse
        }

        // stringify option
        const stringifyOptions: any = {
          header: true, // head mode
          columns: csvHeadObj,
        }
        // export csv
        const csvString: string = stringifySync(resultArray, stringifyOptions);

        // output csv file
        fs.writeFileSync(`output/${formattedDate}.csv`, csvString);

        // close window
        mainWindow.close();
      });

    } catch (e: unknown) {
      // error
      outErrorMsg(e, 2);
    }
  });

  // closing
  mainWindow.on('closed', () => {
    // release window
    mainWindow = null;
  });

});

// choose csv data
const getCsvData = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    // options
    const dialogOptions: csvDialog = {
      properties: ['openFile'], // file open
      title: 'choose csv file', // header title
      defaultPath: '.', // default path
      filters: [
        { name: 'csv(Shif-JIS)', extensions: ['csv'] } // filter
      ],
    }
    // show file dialog
    dialog.showOpenDialog(mainWindow, dialogOptions).then((result: any) => {

      // file exists
      if (result.filePaths.length > 0) {
        // resolved
        resolve(result.filePaths);

        // no file
      } else {
        // rejected
        reject(result.canceled);
      }

    }).catch((e: unknown) => {
      // error
      outErrorMsg(e, 3);
      // rejected
      reject();
    });
  });
}

// show dialog
const showDialog = (title: string, message: string, detail: any, flg: boolean = false): void => {
  try {
    // dialog options
    const options: MessageBoxOptions = {
      type: 'none',
      title: title,
      message: message,
      detail: detail.toString(),
    };

    // error or not
    if (flg) {
      options.type = 'error';

    } else {
      options.type = 'info';
    }

    // show dialog
    dialog.showMessageBox(options);

  } catch (e: unknown) {
    // error
    outErrorMsg(e, 4);
  };
}

// outuput error
const outErrorMsg = (e: unknown, no: number): void => {

  // if type is error
  if (e instanceof Error) {
    // error
    console.log(`${no}: ${e.message}`);
  }
}