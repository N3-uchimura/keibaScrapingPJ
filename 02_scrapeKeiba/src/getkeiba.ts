/**
/* getkeiba.ts
/* getkeiba - Getting keiba data from netkeiba. -
**/

"use strict";

// name space
import { myConst, mySelectors } from './consts/globalvariables';

//* changable Constants
// secretkey
let globalSecretKey: string;
// active course ID
const globalActiveIds: string[] = ['202505020801', '202508020801', '202504010601'];
// racing course
const globalActiveCourseNames: string[] = ['東京', '京都', '新潟'];

//* Constants
const WINDOW_WIDTH: number = 1500; // window width
const WINDOW_HEIGHT: number = 1000; // window height

//* Modules
import * as path from 'node:path'; // path
import { BrowserWindow, app, ipcMain, Tray, Menu, nativeImage } from "electron"; // electron
import { config as dotenv } from 'dotenv'; // dotenv
import * as p from '../package.json';
import { Scrape } from './class/ElScrape0517'; // custom Scraper
import ELLogger from './class/ElLogger'; // logger
import Dialog from './class/ElDialog0414'; // dialog
import CSV from './class/ElCsv0414'; // aggregator
import Crypto from './class/Crypto0518'; // crypto
dotenv({ path: path.join(__dirname, '../.env') }); // env
// desktop path
const dir_home =
  process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"] ?? "";
const dir_desktop = path.join(dir_home, "Desktop");

// log level
const LOG_LEVEL: string = myConst.LOG_LEVEL ?? 'all';
// netkeiba id
const netKeibaId: string = process.env.NETKEIBA_ID ?? '';
// netkeiba pass
const netKeibaPass: string = process.env.NETKEIBA_PASS ?? '';
// loggeer instance
const logger: ELLogger = new ELLogger(myConst.APP_NAME, LOG_LEVEL);
// scraper
const scraper = new Scrape(logger);
// aggregator
const csvMaker = new CSV(myConst.CSV_ENCODING, logger);
// dialog
const dialogMaker: Dialog = new Dialog(logger);
// crypto
const cryptoMaker: Crypto = new Crypto(logger);
// load store
let store: any;
const load = async (): Promise<void> => {
  const { default: Store } = await import('electron-store')
  store = new Store()
}
load()

//* interfaces
// window option
interface windowOption {
  width: number; // window width
  height: number; // window height
  defaultEncoding: string; // default encode
  webPreferences: Object; // node
}
// result array
let resultArray: any[] = [];

// selector array
const selectorArray: string[] = [mySelectors.TURF_SELECTOR, mySelectors.TURF_WIN_SELECTOR, mySelectors.DIRT_SELECTOR, mySelectors.DIRT_WIN_SELECTOR, mySelectors.TURF_DIST_SELECTOR, mySelectors.DIRT_DIST_SELECTOR];
// horse array
const horseDataArray: string[] = ['turf', 'turfwin', 'dirt', 'dirtwin', 'turfdistanse', 'dirtdistanse'];

//* General variables
// main window
let mainWindow: any = null;
// quit flg
let isQuiting: boolean;

// make window
const createWindow = (): void => {
  try {
    // window options
    const windowOptions: windowOption = {
      width: WINDOW_WIDTH, // window width
      height: WINDOW_HEIGHT, // window height
      defaultEncoding: myConst.DEFAULT_ENCODING, // encoding
      webPreferences: {
        nodeIntegration: false, // node
        contextIsolation: true, // isolate
        preload: path.join(__dirname, "preload/preload.js"), // preload
      }
    }
    // Electron window
    mainWindow = new BrowserWindow(windowOptions);
    // hide menubar
    mainWindow.setMenuBarVisibility(false);
    // load index.html
    mainWindow.loadFile(path.join(__dirname, "../index.html"));
    // ready
    mainWindow.once("ready-to-show", async () => {
      // dev mode
      mainWindow.webContents.openDevTools();
      // random key
      const secretKey: string = await cryptoMaker.random(10);
      // save globally
      globalSecretKey = secretKey;
      // version
      const appVersion = p.version ?? '0.0.0';
      console.log(appVersion);
      // language
      const language = store.get('LANG') ?? 'japanese';
      // sending obj
      const initObj = {
        "secret": secretKey, // secret
        "version": appVersion, // app version
        "language": language // language
      }
      // be ready
      mainWindow.send("ready", initObj);
    });

    // minimize and stay on tray
    mainWindow.on("minimize", (event: any): void => {
      // cancel double click
      event.preventDefault();
      // hide window
      mainWindow.hide();
      // return false
      event.returnValue = false;
    });

    // close
    mainWindow.on("close", (event: any): void => {
      // not quitting
      if (!isQuiting) {
        // except for apple
        if (process.platform !== "darwin") {
          // quit
          app.quit();
          // return false
          event.returnValue = false;
        }
      }
    });

    // when close
    mainWindow.on("closed", (): void => {
      // destryo window
      mainWindow.destroy();
    });

  } catch (e: unknown) {
    // error
    if (e instanceof Error) {
      // show error
      dialogMaker.showmessage("error", `${e.message}`);
    }
  }
};

// enable sandbox
app.enableSandbox();

// avoid double ignition
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log("メインプロセスが多重起動しました。終了します。");
  app.quit();
}

// ready
app.on("ready", async () => {
  logger.info("app: electron is ready");
  // make window
  createWindow();
  // app icon
  const icon: Electron.NativeImage = nativeImage.createFromPath(
    path.join(__dirname, "assets/keiba128.ico")
  );
  // tray
  const mainTray: Electron.Tray = new Tray(icon);
  // contextMenu
  const contextMenu: Electron.Menu = Menu.buildFromTemplate([
    // show
    {
      label: "表示",
      click: () => {
        mainWindow.show();
      },
    },
    // close
    {
      label: "閉じる",
      click: () => {
        isQuiting = true;
        app.quit();
      },
    },
  ]);
  // set contextMenu
  mainTray.setContextMenu(contextMenu);
  // show on double click
  mainTray.on("double-click", () => mainWindow.show());
});

// activated
app.on("activate", () => {
  // no window
  if (BrowserWindow.getAllWindows().length === 0) {
    // reboot
    createWindow();
  }
});

// quit button
app.on("before-quit", () => {
  // flg on
  isQuiting = true;
});

// closed
app.on("window-all-closed", () => {
  logger.info("app: close app");
  // quit
  app.quit();
});

/* IPC */
// config
ipcMain.on("config", async (_, arg) => {
  logger.info("app: config app");
  // correct
  if (globalSecretKey == arg) {
    // language
    const language = store.get('LANG') ?? 'japanese';
    mainWindow.send("ready", {
      lang: language,
      secert: globalSecretKey
    });
    // goto config page
    await mainWindow.loadFile(path.join(__dirname, "../config.html"));
  }
});

// index
ipcMain.on("topapp", async (_, arg) => {
  logger.info("app: top app");
  // correct
  if (globalSecretKey == arg) {
    // goto config page
    await mainWindow.loadFile(path.join(__dirname, "../index.html"));
  }
});

// exit
ipcMain.on("language", async (_, arg) => {
  logger.info("app: exit app");
  // correct
  if (globalSecretKey == arg.secret) {
    // set language to storage
    store.set('LANG', arg.language ? 'japanese' : 'english');
  }
});

// exit
ipcMain.on("exitapp", async (_, arg) => {
  logger.info("app: exit app");
  // correct
  if (globalSecretKey == arg) {
    // excrpt for apple
    if (process.platform !== "darwin") {
      app.quit();
      return false;
    }
  }
});

// error
ipcMain.on("error", async (_: any, arg: any) => {
  logger.info("ipc: error mode");
  // show error
  dialogMaker.showmessage("error", `${arg})`);
});

// get horseURL
ipcMain.on("url", async (_, arg) => {
  try {
    logger.info("ipc: geturl mode");
    // correct
    if (globalSecretKey == arg) {
      // header array
      const columnArray: string[] = ['horse', 'url'];
      // file reading
      const filename: string = await csvMaker.showCSVDialog(mainWindow);
      // get data
      const tmpRecords: any = await csvMaker.getCsvData(filename);
      // horse names
      const records: string[] = tmpRecords.record.map((item: any) => item[0]);
      // initialize
      await scraper.init();
      // goto page
      await scraper.doGo(myConst.BASE_URL);
      logger.debug(`scraping ${myConst.BASE_URL}...`);
      // wait for loading
      await scraper.doWaitFor(3000);

      // loop words
      for (const rd of records) {
        try {
          // empty array
          let tmpObj: any = {
            horse: '', // horse name
            url: '', // url
          };
          // input word
          await scraper.doType('.Txt_Form', rd);
          // click submit button
          await scraper.doClick('.Submit_Btn');
          // wait for loading
          await scraper.doWaitFor(2000);
          // get urls
          const tmpUrl = await scraper.getUrl() ?? '';
          // insert horse name
          tmpObj.horse = rd;
          // insert url
          tmpObj.url = tmpUrl;

          // url exists
          if (tmpUrl && tmpUrl != '') {
            resultArray.push(tmpObj);
          }

        } catch (e: unknown) {
          logger.error(e);
          // goto page
          await scraper.doGo(myConst.HORSE_BASE_URL);
          // wait for loading
          await scraper.doWaitFor(3000);
        }
      }
      // format date
      const formattedDate: string = 'url_' + (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 14);
      // file path
      const filePath: string = path.join(dir_desktop, formattedDate + '.csv');
      // make csv data
      await csvMaker.makeCsvData(resultArray, columnArray, filePath);
      // end message
      dialogMaker.showmessage('info', 'completed.');
      logger.info('completed.');
      // close window
      mainWindow.close();
    } else {
      // key error
      throw new Error('ipc: illegal secret key');
    }

  } catch (e: unknown) {
    logger.error(e);
  }
});

// get horse sire
ipcMain.on("sire", async (_, arg) => {
  try {
    logger.info("ipc: getsire mode");
    // correct
    if (globalSecretKey == arg) {
      // chosen filename
      const filename: string = await csvMaker.showCSVDialog(mainWindow);
      // read csv file
      const tmpRecords: any = await csvMaker.getCsvData(filename);
      // extract first column
      const urls: string[] = tmpRecords.record.map((item: any) => item.urls);
      const horses: string[] = tmpRecords.record.map((item: any) => item.horse);
      // initialize
      await scraper.init();

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
          await scraper.doGo(myConst.SIRE_BASE_URL + urls[i]);
          // wait for selector
          await scraper.doWaitFor(3000);
          logger.info(`goto ${myConst.SIRE_BASE_URL + urls[i]}`);

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
      const csvColumnArray: string[] = ['horse', 'turf', 'turfwin', 'dirt', 'dirtwin', 'turfdistanse', 'dirtdistanse',];
      // today date
      const formattedDate: string = 'sire_' + (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 8);
      // file path
      const filePath: string = path.join(dir_desktop, formattedDate + '.csv');
      // make csv
      await csvMaker.makeCsvData(resultArray, csvColumnArray, filePath)
      // end message
      dialogMaker.showmessage('info', 'completed.');
      logger.info('completed.');
      // close window
      mainWindow.close();
    } else {
      // key error
      throw new Error('ipc: illegal secret key');
    }

  } catch (e: unknown) {
    logger.error(e);
  }
});

// get horse training
ipcMain.on("training", async (_, arg) => {
  try {
    // correct
    if (globalSecretKey == arg) {
      logger.info("ipc: gettraining mode");
      // for race loop
      const racenums: number[] = [...Array(2)].map((_, i) => i + 1);
      // formattedDate
      const formattedDate: string = 'training_' + (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 8);
      // file path
      const tmpFilePath: string = path.join(dir_desktop, formattedDate);
      // last array
      let wholeArray: any = [];
      // initialize
      await scraper.init();
      // goto netkeiba
      await scraper.doGo(myConst.BASE_URL);
      logger.debug(`goto ${myConst.BASE_URL}`);
      // wait for loading of login button
      await scraper.doWaitFor(2000);
      // click login
      await scraper.doClick('.Icon_Login');
      // wait for id/pass input
      await scraper.doWaitFor(3000);
      // input id
      await scraper.doType('input[name="login_id"]', netKeibaId);
      // input pass
      await scraper.doType('input[name="pswd"]', netKeibaPass);
      // wait 3 sec
      await scraper.doWaitFor(3000);
      // click login button
      await scraper.doClick('.loginBtn__wrap input');
      // wait 3 sec
      await scraper.doWaitFor(3000);

      // loop each races
      for await (const [idx, raceId] of Object.entries(globalActiveIds)) {

        // index
        const targetIdx: number = Number(idx);
        // course name
        const targetCournseName: string = globalActiveCourseNames[targetIdx];
        // course
        const targetCourse: string = raceId.slice(0, -2);
        // base url
        const baseUrl: string = `${myConst.TRAINING_BASE_URL}?race_id=${targetCourse}`;
        // csv filename
        const filePath: string = `${tmpFilePath}_${targetCournseName}.csv`;

        // loop each races
        for await (let j of racenums) {
          try {
            // last array
            let finalArray: any = [];
            // race
            const raceName: string = `${targetCournseName}${j}R`;
            // url
            const targetUrl: string = `${baseUrl}${String(j).padStart(2, '0')}${myConst.DEF_URL_QUERY}`;
            // goto site
            await scraper.doGo(targetUrl);
            // wait for datalist
            await scraper.doWaitFor(3000);
            // for loop
            const horsenums: number[] = [...Array(18)].map((_, i) => i + 1);
            // loop each horses
            for await (let i of horsenums) {
              try {
                await scraper.doWaitFor(1000);
                // no element break
                if (!await scraper.doCheckSelector(`.OikiriDataHead${i} .Horse_Info .Horse_Name a`)) {
                  break;
                }
                const postArray: any = await Promise.all([
                  // horse name
                  scraper.doSingleEval(`.OikiriDataHead${i} .Horse_Info .Horse_Name a`, 'innerHTML'),
                  // date
                  scraper.doSingleEval(`.OikiriDataHead${i} .Training_Day`, 'innerHTML'),
                  // place
                  scraper.doSingleEval(`.OikiriDataHead${i} td:nth-child(6)`, 'innerHTML'),
                  // condition
                  scraper.doSingleEval(`.OikiriDataHead${i} td:nth-child(7)`, 'innerHTML'),
                  // training strength
                  scraper.doSingleEval(`.OikiriDataHead${i} .TrainingLoad`, 'innerHTML'),
                  // training review
                  scraper.doSingleEval(`.OikiriDataHead${i} .Training_Critic`, 'innerHTML'),
                  // rap time
                  scraper.doMultiEval(`.OikiriDataHead${i} .TrainingTimeData .TrainingTimeDataList li .RapTime`, 'innerHTML'),
                  // cell color
                  scraper.doMultiEval(`.OikiriDataHead${i} .TrainingTimeData .TrainingTimeDataList li`, 'className'),
                ]);

                // set to array
                finalArray.push(postArray);
                // wait 0.5 sec
                await scraper.doWaitFor(500);

              } catch (e) {
                logger.error(e);
                break;
              }
            }

            // put into wholearray
            wholeArray.push(finalArray);
            // wait 0.5 sec
            await scraper.doWaitFor(500);
            logger.debug(`${raceName} finished`);

          } catch (err2: unknown) {
            // error
            logger.error(err2);
          }
        }

        // header
        let columns: string[] = ['馬名', '実施日', '競馬場', '馬場状態', '強さ', 'レビュー', 'ラップ1', 'ラップ2', 'ラップ3', 'ラップ4', 'ラップ5', '色1', '色2', '色3', '色4', '色5'];
        // finaljson
        let finalJsonArray: any[] = [];
        // all races
        wholeArray.forEach((races: any) => {
          // for training
          races.forEach((data: any) => {

            // empty array
            let tmpObj: { [key: string]: string } = {
              horse: '', // horse name
              date: '', // date
              place: '', // training center
              condition: '', // field condition
              strength: '', // training strength
              review: '', // review comment
              time1: '', // rap time
              time2: '', // rap time
              time3: '', // rap time
              time4: '', // rap time
              time5: '', // rap time
              color1: '', // training color
              color2: '', // training color
              color3: '', // training color
              color4: '', // training color
              color5: '', // training color
            };
            // set each value
            tmpObj.horse = data[0];
            tmpObj.date = data[1];
            tmpObj.place = data[2];
            tmpObj.condition = data[3];
            tmpObj.strength = data[4];
            tmpObj.review = data[5];
            tmpObj.time1 = data[6][0];
            tmpObj.time2 = data[6][1];
            tmpObj.time3 = data[6][2];
            tmpObj.time4 = data[6][3];
            tmpObj.time5 = data[6][4];
            tmpObj.color1 = data[7][0];
            tmpObj.color2 = data[7][1];
            tmpObj.color3 = data[7][2];
            tmpObj.color4 = data[7][3];
            tmpObj.color5 = data[7][4];
            // set to json
            finalJsonArray.push(tmpObj);
          });
        });
        // write data
        await csvMaker.makeCsvData(finalJsonArray, columns, filePath);
        logger.info(`csv completed.`);
      }
    } else {
      // key error
      throw new Error('ipc: illegal secret key');
    }

  } catch (e: unknown) {
    logger.error(e);
  } finally {
    // close browser
    await scraper.doClose();
  }
});
