/**
/* UrlGetterKeiba.ts
/* UrlGetterKeiba - Getting horse url -
**/

"use strict";

//* Constants
const WINDOW_WIDTH: number = 1000; // window width
const WINDOW_HEIGHT: number = 1000; // window height
const DEFAULT_ENCODING: string = 'utf8'; // encoding
const CSV_ENCODING: string = 'Shift_JIS'; // csv encoding
const TARGET_URL: string = 'https://www.netkeiba.com/'; // base url

//* Modules
import { app, BrowserWindow, dialog } from 'electron'; // electron
import * as fs from 'fs'; // fs
import * as path from 'path'; // path
import parse from 'csv-parse/lib/sync'; // csv parser
import stringifySync from 'csv-stringify/lib/sync'; // csv stfingifier
import iconv from 'iconv-lite'; // text converter
import { Scrape } from './class/Scrape1102'; // custom Scraper
import { FileFilter } from 'electron/main'; // filefilter

//* Interfaces
// window options
interface windowOption {
  width: number; // window width
  height: number; // window height
  defaultEncoding: string; // default encode
  webPreferences: Object; // node
}

// csv stringify option
interface csvStringify {
  header: boolean; // header
  columns: Csvheaders[]; // columns
}

// csv dialog option
interface csvDialog {
  properties: any; // file open
  title: string; // header title
  defaultPath: string; // default path
  filters: FileFilter[]; // filter
}

// tmp records
interface parseRecords {
  columns: boolean; // columns
  from_line: number; // line start
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

    }).catch((err: unknown) => {
      // error
      console.log(`error occured ${err}`);
      // rejected
      reject(err);
    });
  });
}

// show dialog
const showDialog = (title: any, message: any, detail: any, flg: boolean = false) => {
  // dialog options
  const options: any = {
    type: '',
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
}

// csv file dialog
const getFilename = (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    // get csv
    getCsvData()
      // success
      .then(res => {
        const filename: string = res[0];
        // resolved
        resolve(filename);
      })
      // error
      .catch(err => {
        // show error dialog
        showDialog('no file', 'no csv file selected.', err, true);
        // reject
        reject(new Error('no file error'));
      });
  });
}

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

    // file reading
    const filename = await getFilename();

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

    // read file
    fs.readFile(filename, async (err: any, data: any) => {
      // variable
      let tmpRecords: string[] = [];
      // initialize
      await scraper.init();
      console.log('scraping ..');

      // decoder
      const str = iconv.decode(data, CSV_ENCODING);

      // error
      if (err) throw err;

      // record option
      const recordOptions: parseRecords = {
        columns: false, // no specified columns
        from_line: 2, // from line 2
      }
      // csv reading
      tmpRecords = await parse(str, recordOptions);

      // horse names
      const records: string[] = tmpRecords.map(item => item[0]);

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
      const stringifyOptions: csvStringify = {
        header: true, // head mode
        columns: headerObjArray,
      }
      // export csv
      const csvString: string = stringifySync(resultArray, stringifyOptions);
      // format date
      const formattedDate: string = (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 14);

      // output csv file
      await fs.promises.writeFile(`output/${formattedDate}.csv`, csvString);

      // close window
      mainWindow.close();

    });

    // closing
    mainWindow.on('closed', () => {
      // release window
      mainWindow = null;
    });

  } catch (e: unknown) {
    // show error dialog
    showDialog('export error', 'error occured when exporting csv.', e, true);
  }

});