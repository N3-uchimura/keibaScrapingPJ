/**
 * getShubobaData.ts
 *
 * function：get all data from urls
**/

'use strict';

// name space
import { myConst } from './consts/globalvariables';

// read modules
import * as fs from 'node:fs'; // fs
import { readdir } from 'node:fs/promises'; // file system
import readline from 'readline'; // readline
import readlineSync from 'readline-sync'; // readsync
import { Scrape } from './class/Scrape0517'; // scraper
import CSV from './class/Csv0517'; // aggregator
import Logger from './class/Logger'; // logger
import mkdir from './class/Mkdir0517'; // mdkir

// loggeer instance
const logger: Logger = new Logger(myConst.APP_NAME, true);
// scraper
const scraper = new Scrape(logger);
// aggregator
const csvMaker = new CSV(myConst.CSV_ENCODING, logger);
// mkdir
const mkdirManager = new mkdir(logger);

// read urls
const readLines = async (): Promise<string[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info('reading lines...');
      // urls
      let urls: string[] = new Array();
      // list files
      const fileList: string[] = await listFiles();
      // select file
      const targetfileName: string = await showDialog(fileList);
      // make readstream
      const rs: fs.ReadStream = fs.createReadStream(`./txt/${targetfileName}`);
      // config ure interface
      const rl: readline.Interface = readline.createInterface({
        // stream setting
        input: rs
      });

      // read one by one
      rl.on('line', (lineString: any) => {
        // push into array
        urls.push(lineString);
      });

      // close readline
      rl.on('close', () => {
        logger.info("END!");
        // resolve
        resolve(urls);
      });

    } catch (e: unknown) {
      // error
      logger.error(e);
      // rejected
      reject();
    }
  });
}

// * general functions
// show diallog
const showDialog = (array: string[]): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // dialog options
      const index: number = readlineSync.keyInSelect(array, 'which file?');
      logger.info(`read ${array[index]}.`);
      // return target filename
      resolve(array[index]);

    } catch (e: unknown) {
      // error
      logger.error(e);
      // rejected
      reject();
    }
  });
}

// list files
const listFiles = (): Promise<string[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      // file list
      const fileNames: string[] = await readdir('./txt');
      // return filename array
      resolve(fileNames);

    } catch (e: unknown) {
      // error
      logger.error(e);
      // rejected
      reject();
    }
  });
}

// main
(async (): Promise<void> => {
  try {
    logger.info('getShubobaData: scraping start.');
    // str variables
    let strArray: any[] = [];
    // make dir
    await mkdirManager.mkDirAll(['./logs', './csv', './txt']);
    // header
    const sheetTitleArray: string[] = ['horsename', 'birthday', 'country', 'color', 'service', 'win', 'father', 'mother', 'motherfather', 'inbreed', 'cropwin', 'cropwinnative'];
    // target selector
    const selectorArray: string[] = ['title', 'table tr:nth-child(1) td', 'table tr:nth-child(2) td', 'table tr:nth-child(3)  td', 'table tr:nth-child(4) td', 'table tr:nth-child(8) td', 'table tr:nth-child(12) td', 'table tr:nth-child(13) td', 'table tr:nth-child(14) td', 'table tr:nth-child(15) td', 'table tr:nth-child(23) td', 'table tr:nth-child(24) td'];
    // links
    const linkArray: string[] = await readLines();

    // initialize
    await scraper.init();

    // number array
    const makeNumberRange = (start: number, end: number) => [...new Array(end - start).keys()].map(n => n + start);

    // loop urls
    for await (const url of linkArray) {
      logger.info(`scraping...${url}`);
      // goto shuboba-profile
      await scraper.doGo(url);
      // horse header
      let myHorseObj: { [key: string]: string } = {
        horsename: '',
        birthday: '',
        country: '',
        color: '',
        service: '',
        win: '',
        father: '',
        mother: '',
        motherfather: '',
        inbreed: '',
        cropwin: '',
        cropwinnative: '',
      };

      // loop in selectors
      for await (const i of makeNumberRange(0, 11)) {
        // result
        const result: string = await scraper.doSingleEval(selectorArray[i], 'textContent');
        // get into array
        myHorseObj[sheetTitleArray[i]] = result;

      }
      console.log(myHorseObj);
      // push to tmp array
      strArray.push(myHorseObj);
    }

    // filename
    const fileName: string = (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 14);
    // filepath
    const filePath: string = `./csv/${fileName}.csv`;
    // write data
    await csvMaker.makeCsvData(strArray, sheetTitleArray, filePath);

    // close browser
    await scraper.doClose();

  } catch (e: unknown) {
    // error
    logger.error(e);
  }

})();