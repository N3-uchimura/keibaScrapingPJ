/**
 * getShubobaLinks.ts
 *
 * function：get all links form shuboba-profile
**/

const BASE_URL: string = 'http://keiba.no.coocan.jp/data/_index_';
const FOREIGN_URL: string = 'a-z'; // target url

// read modules
import * as fs from 'fs'; // fs
import { Scrape } from './class/Scrape0804'; // scraper

// scraper
const scraper = new Scrape();

// number array
const makeNumberRange = (start: number, end: number) => [...new Array(end - start).keys()].map(n => n + start);

// main
(async (): Promise<void> => {
  try {
    // urls
    let urlArray: string[] = [];
    // url texts
    let urlTxtArray: string[] = [];
    // initialize
    await scraper.init();
    // scraping loop
    /*for await (const i of makeNumberRange(1, 10)) {
      try {
        // filename
        const fileName: string = String(i).padStart(2, '0');
        const fileTxtName: string = String(i).padStart(2, '0') + "_txt";
        // tmp url
        const tmpUrl: string = BASE_URL + String(i).padStart(2, '0') + '.html';
        // goto page
        await scraper.doGo(tmpUrl);
        // wait
        await scraper.doWaitFor(1000);
        // get data
        urlArray = await scraper.doMultiEval('a', 'href');
        // get url text
        urlTxtArray = await scraper.doMultiEval('a', 'textContent');
        // delete top data
        urlArray.shift();
        urlTxtArray.shift();
        // delete bottom data
        urlArray.pop();
        urlTxtArray.pop();
        // combined data
        const urlStr: string = urlArray.join("\n");
        // combined data
        const txtStr: string = urlTxtArray.join("\n");
        // write file
        await fs.promises.writeFile(`./txt/${fileName}.txt`, urlStr)
        // write file
        await fs.promises.writeFile(`./txt/${fileTxtName}.txt`, txtStr)

      } catch (e) {
        console.log(e);
      }

    }
      */
    // filename
    const fileName: string = FOREIGN_URL;
    const fileTxtName: string = FOREIGN_URL + "_txt";
    // tmp url
    const foreignUrl: string = BASE_URL + FOREIGN_URL + '.html';
    // goto page
    await scraper.doGo(foreignUrl);
    // wait
    await scraper.doWaitFor(1000);
    // get data
    urlArray = await scraper.doMultiEval('a', 'href');
    // get url text
    urlTxtArray = await scraper.doMultiEval('a', 'textContent');
    // combined data
    const urlStr: string = urlArray.join("\n");
    // combined data
    const txtStr: string = urlTxtArray.join("\n");
    // write file
    await fs.promises.writeFile(`./txt/${fileName}.txt`, urlStr)
    // write file
    await fs.promises.writeFile(`./txt/${fileTxtName}.txt`, txtStr)
    // close browser
    await scraper.doClose();

  } catch (e) {
    console.log(e);
  }

})();
