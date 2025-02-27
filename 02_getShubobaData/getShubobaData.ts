/**
 * getShubobaData.ts
 *
 * function：get all data from urls
**/

'use strict';

// read modules
import * as fs from 'fs'; // fs
import readline from 'readline'; // readline
import readlineSync from 'readline-sync'; // readsync
import { Scrape } from './class/Scrape0120'; // scraper
import CSV from './class/Csv0120'; // aggregator
import Logger from './class/Logger0227'; // logger
import mkdir from './class/Mkdir0217'; // mdkir

// scraper
const scraper = new Scrape();
// aggregator
const csvMaker = new CSV('SJIS');
// loggeer instance
const logger: Logger = new Logger('getShubobaData');
// mkdir
const mkdirManager = new mkdir();

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
      const fileNames: string[] = await fs.promises.readdir('./txt');
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
    // str variables
    let strArray: string[][] = [];
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

    // counter
    let counter: number = 0;
    // loop urls
    for (const url of linkArray) {
      logger.info(`scraping...${counter}`);
      // goto shuboba-profile
      await scraper.doGo(url);
      // increment
      counter++;
    }

    // horse header
    let columns: { [key: string]: string } = {
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
      columns[sheetTitleArray[i]] = result;
    }

    // filename
    const fileName: string = (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 14);
    // filepath
    const filePath: string = `./csv/${fileName}.csv`;
    // write data
    await csvMaker.makeCsvData(strArray, columns, filePath);

    // close browser
    await scraper.doClose();

  } catch (e: unknown) {
    // error
    logger.error(e);
  }

})();