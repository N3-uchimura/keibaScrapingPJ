/**
 * getShubobaLinks.ts
 *
 * function：get all links form shuboba-profile
**/

'use strict';

//* Constants
const FOREIGN_URL: string = 'a-z'; // target url
// name space
import { myConst } from './consts/globalvariables';

// read modules
import * as path from 'path'; // path
import { writeFile } from 'node:fs/promises'; // file system
import { config as dotenv } from 'dotenv'; // dotenv
import { Scrape } from './class/Scrape0517'; // scraper
import Logger from './class/Logger'; // logger
import mkdir from './class/Mkdir0517'; // mdkir
dotenv({ path: path.join(__dirname, '.env') }); // env

// re define
const BASE_URL: string = process.env.BASE_URL ?? '';
// loggeer instance
const logger: Logger = new Logger(myConst.APP_NAME, true);
// scraper
const scraper = new Scrape(logger);
// mkdir
const mkdirManager = new mkdir(logger);
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
    await writeFile(`./txt/${fileName}.txt`, urlStr);
    logger.info('getShubobaLinks: txt file output finished.');
    // close browser
    await scraper.doClose();

  } catch (e) {
    logger.error(e);
  }
})();
