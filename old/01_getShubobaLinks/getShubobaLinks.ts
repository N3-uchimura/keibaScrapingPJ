/**
 * getShubobaLinks.ts
 *
 * function：get all links form shuboba-profile
**/

'use strict';

//* Constants
const APP_NAME: string = 'getShubobaLinks'; // app name
const BASE_URL: string = 'http://keiba.no.coocan.jp/data/_index_';
const FOREIGN_URL: string = 'a-z'; // target url

// read modules
import * as fs from 'fs'; // fs
import { Scrape } from './class/Scrape0301'; // scraper
import Logger from './class/Logger'; // logger
import mkdir from './class/Mkdir0301'; // mdkir

// scraper
const scraper = new Scrape();
// loggeer instance
const logger: Logger = new Logger(APP_NAME, true);
// mkdir
const mkdirManager = new mkdir();
// number array
const makeNumberRange = (start: number, end: number): number[] => [...new Array(end - start).keys()].map(n => n + start);

// main
(async (): Promise<void> => {
  try {
    logger.info('getShubobaLinks: scraping start.');
    // texts
    let urlArray: string[][] = [];
    // make dir
    await mkdirManager.mkDirAll(['./logs', './txt']);
    // initialize
    await scraper.init();

    // scraping loop
    for await (const i of makeNumberRange(1, 10)) {
      try {
        // texts
        let tmpUrlArray: string[] = [];
        // tmp url
        const tmpUrl: string = BASE_URL + String(i).padStart(2, '0') + '.html';
        // goto page
        await scraper.doGo(tmpUrl);
        // wait
        await scraper.doWaitFor(1000);
        // get data
        tmpUrlArray = await scraper.doMultiEval('a', 'href');
        // delete top data
        tmpUrlArray.shift();
        // delete bottom data
        tmpUrlArray.pop();
        // add to two-dimentional array
        urlArray.push(tmpUrlArray);

      } catch (err) {
        logger.error(err);
      }
    }
    logger.info('getShubobaLinks: scraping has finished.');
    // filename
    const fileName: string = FOREIGN_URL;
    // tmp url
    const foreignUrl: string = BASE_URL + FOREIGN_URL + '.html';
    // goto page
    await scraper.doGo(foreignUrl);
    // wait
    await scraper.doWaitFor(1000);
    // get data
    const foreignUrlArray: string[] = await scraper.doMultiEval('a', 'href');
    // add to two-dimentional array
    urlArray.push(foreignUrlArray);
    // final array
    const finalUrlArray: string[] = urlArray.flat();
    // delete last one
    finalUrlArray.pop();
    // combined data
    const urlStr: string = finalUrlArray.join("\n");
    // write file
    await fs.promises.writeFile(`./txt/${fileName}.txt`, urlStr);
    logger.info('getShubobaLinks: txt file output finished.');
    // close browser
    await scraper.doClose();

  } catch (e) {
    logger.error(e);
  }
})();
