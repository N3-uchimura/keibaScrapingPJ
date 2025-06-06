/**
 * getkeiba.ts
 *
 * getkeiba - Getting keiba data from netkeiba. -
**/

"use strict";

// name space
import { myConst, mySelectors, myRaces } from './consts/globalvariables';

//* Constants
const WINDOW_WIDTH: number = 1000; // window width
const WINDOW_HEIGHT: number = 1000; // window height

//* Modules
import * as path from 'node:path'; // path
import { readdir, stat } from 'node:fs/promises'; // filesystem
import * as mime from 'mime-types'; // mime
import dayjs from 'dayjs'; // dayjs
import axios from "axios"; // http
import keytar from "keytar"; // save key
import { BrowserWindow, app, ipcMain, Tray, Menu, nativeImage } from "electron"; // electron
import { config as dotenv } from 'dotenv'; // dotenv
import { Scrape } from './class/ElScrape0531'; // custom Scraper
import ELLogger from './class/ElLogger'; // logger
import Dialog from './class/ElDialog0414'; // dialog
import CSV from './class/ElCsv0414'; // aggregator
import MKDir from './class/ElMkdir0414'; // mdkir
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
// mkdir
const mkdirManager = new MKDir(logger);
// aggregator
const csvMaker = new CSV(myConst.CSV_ENCODING, logger);
// dialog
const dialogMaker: Dialog = new Dialog(logger);

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
      // mainWindow.webContents.openDevTools();
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
  // show error message
  dialogMaker.showmessage("error", "Double ignition. break.");
  // close app
  app.quit();
}

// ready
app.on("ready", async () => {
  logger.info("app: electron is ready");
  // make window
  createWindow();

  // menu label
  let displayLabel: string = '';
  // close label
  let closeLabel: string = '';
  // get language
  const language = await keytar.getPassword('language', 'admin') ?? 'japanese';
  // switch on language
  if (language == 'japanese') {
    // set menu label
    displayLabel = '表示';
    // set close label
    closeLabel = '閉じる';
  } else {
    // set menu label
    displayLabel = 'show';
    // set close label
    closeLabel = 'close';
  }
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
      label: displayLabel,
      click: () => {
        mainWindow.show();
      },
    },
    // close
    {
      label: closeLabel,
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
app.on("activate", async () => {
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
// ready
ipcMain.on("beforeready", async (_, __) => {
  logger.info("app: beforeready app");
  // language
  const language = await keytar.getPassword('language', 'admin') ?? 'japanese';
  // be ready
  mainWindow.send("ready", language);
});

// config
ipcMain.on("config", async (_, arg: any) => {
  logger.info("app: config app");
  // language
  const language = await keytar.getPassword('language', 'admin') ?? 'japanese';
  // goto config page
  await mainWindow.loadFile(path.join(__dirname, "../config.html"));
  // language
  mainWindow.send("confready", language);
});

// save
ipcMain.on("save", async (_, arg: any) => {
  logger.info("app: save config");
  // date
  const language: string = String(arg);
  // language
  await keytar.setPassword('language', 'admin', language);
  // goto config page
  await mainWindow.loadFile(path.join(__dirname, "../index.html"));
  // language
  mainWindow.send("topready", language);
});

// exit
ipcMain.on("exitapp", async (_, __) => {
  logger.info("app: exit app");
  // excrpt for apple
  if (process.platform !== "darwin") {
    // exit app
    app.quit();
    return false;
  }
});

// error
ipcMain.on("error", async (_, arg: any) => {
  logger.info("ipc: error mode");
  // show error
  dialogMaker.showmessage("error", `${arg})`);
});

// get horseURL
ipcMain.on("url", async (event: any, _) => {
  try {
    logger.info("ipc: geturl mode");
    // make dir
    mkdirManager.mkDir('csv');
     // success Counter
    let successCounter: number = 0;
    // fail Counter
    let failCounter: number = 0;
    // finish message
    let endmessage: string;
    // header array
    const columnArray: string[] = ['horse', 'url'];
    // file reading
    const filename: any = await csvMaker.showCSVDialog(mainWindow);
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
    // send totalWords
    event.sender.send("total", {len: records.length});

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
          // inset into array
          resultArray.push(tmpObj);
          // increment success
          successCounter++;
        } else {
          // increment fail
          failCounter++;
        }

      } catch (e: unknown) {
        logger.error(e);
        // increment fail
        failCounter++;

      } finally {
        // send success
        event.sender.send("success", successCounter);
        // send fail
        event.sender.send("fail", failCounter);
        // goto page
        await scraper.doGo(myConst.BASE_URL);
        // wait for loading
        await scraper.doWaitFor(3000);
      }
    }
    // format date
    const formattedDate: string = 'url_' + (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 14);
    // file path
    const filePath: string = path.join(__dirname, '../csv', formattedDate + '.csv');
    // make csv data
    await csvMaker.makeCsvData(resultArray, columnArray, filePath);
    
    // language
    const language = await keytar.getPassword('language', 'admin') ?? 'japanese';
    // switch on language
    if (language == 'japanese') {
      // set finish message
      endmessage = '完了しました。';
    } else {
      // set finish message
      endmessage = 'completed';
    }
    // end message
    dialogMaker.showmessage('info', endmessage);
    logger.info('completed.');

  } catch (e: unknown) {
    logger.error(e);
  }
});

// get horse sire
ipcMain.on("presire", async (event: any, _) => {
  try {
    logger.info("ipc: presire mode");
    // date
    let fixedDates: any[] = [];
    // promises
    let promises: Promise<any>[] = [];
    // dir path
    const dirPath: string = path.join(__dirname, '../csv');
    // files
    const files: any = await readdir(dirPath);
    // extract csv
    const csvFiles: any = files.filter((file: any) =>  mime.lookup(path.extname(file)) == 'text/csv');
    // make promises
    for (let csv of csvFiles) { 
      promises.push(stat(path.join(dirPath, csv)));
    }
    // get from DB
    const csvStatsArray: any = await Promise.all(promises);
    // set date
    for (let stat of csvStatsArray) { 
      fixedDates.push(dayjs(stat.mtime).format("YYYY-MM-DD HH:mm:ss"));
    }
    // send totalWords
    event.sender.send("file", {
      file: csvFiles,
      date: fixedDates,
    });

  } catch (e: unknown) {
    logger.error(e);
  }
});

// get horse sire
ipcMain.on("sire", async (event: any, arg: any) => {
  try {
    logger.info("ipc: getsire mode");
    // success Counter
    let successCounter: number = 0;
    // fail Counter
    let failCounter: number = 0;
    // finish message
    let endmessage: string;
    // csv path
    const csvFilePath: string = path.join(__dirname, '../csv', String(arg));
    // read csv file
    const tmpRecords: any = await csvMaker.getCsvData([csvFilePath]);
    // extract second column
    const urls: string[] = tmpRecords.record.map((item: any) => item[1]);
    // extract first column
    const horses: string[] = tmpRecords.record.map((item: any) => item[0]);
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
        await scraper.doGo(myConst.SIRE_BASE_URL + urls[i].replace(myConst.HORSE_BASE_URL, ''));
        // wait for selector
        await scraper.doWaitFor(3000);
        logger.info(`goto ${myConst.SIRE_BASE_URL + urls[i].replace(myConst.HORSE_BASE_URL, '')}`);
        // send totalWords
        event.sender.send("total", {len: urls.length, place: horses[i]});
        
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
                tmpObj[myRaces.HORSEDATA_COLUMNS[j]] = scrapedData;
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
        
        // add to result array
        resultArray.push(tmpObj);
        // increment success
        successCounter++;
        
      } catch (e: unknown) {
        logger.error(e);
        // increment fail
        failCounter++;

      } finally {
        // send success
        event.sender.send("success", successCounter);
        // send fail
        event.sender.send("fail", failCounter);
      }
    }
    // csv header
    const csvColumnArray: string[] = ['horse', 'turf', 'turfwin', 'dirt', 'dirtwin', 'turfdistanse', 'dirtdistanse',];
    // today date
    const formattedDate: string = 'sire_' + (new Date).toISOString().replace(/[^\d]/g, "");
    // file path
    const filePath: string = path.join(dir_desktop, formattedDate + '.csv');
    // make csv
    await csvMaker.makeCsvData(resultArray, csvColumnArray, filePath);
    // language
    const language = await keytar.getPassword('language', 'admin') ?? 'japanese';
    // switch on language
    if (language == 'japanese') {
      // set finish message
      endmessage = '完了しました。';
    } else {
      // set finish message
      endmessage = 'completed';
    }
    // end message
    dialogMaker.showmessage('info', endmessage);
    logger.info('completed.');

  } catch (e: unknown) {
    logger.error(e);
  }
});

// get horse training
ipcMain.on("training", async (event: any, arg: any) => {
  try {
    logger.info("ipc: gettraining mode");
    // success Counter
    let successCounter: number = 0;
    // fail Counter
    let failCounter: number = 0;
    // aget date
    await keytar.setPassword('date', 'admin', arg);
    // finish message
    let endmessage: string;
    
    // formattedDate
    const dateString: string = (new Date).toISOString().slice(0, 10);
    // get date
    const date: string = await keytar.getPassword('date', 'admin') ?? dateString;
    // race data
    const raceNoData: any = await httpsPost('https://keiba.numthree.net/race/getracingno', { date: date });
    // empty
    if (raceNoData.no.length == 0) {
      // error message
      let racingErrorMsg: string;
      // get date
      const language: string = await keytar.getPassword('language', 'admin') ?? 'japanese';
      // switch language
      if (language == 'japanese') {
        // japanese error
        racingErrorMsg = "開催日ではありません";
      } else {
        // english error
        racingErrorMsg = "not the racing date";
      }
      // error
      throw new Error(racingErrorMsg);
    }
    // header
    const trainingColumns: string[] = ['race', 'horse', 'date', 'place', 'condition', 'strength', 'review', 'lap1', 'lap2', 'lap3', 'lap4', 'lap5', 'color1', 'color2', 'color3', 'color4', 'color5'];
    // for race loop
    const racenums: number[] = [...Array(12)].map((_, i) => i + 1);
    // formattedDate
    const formattedDate: string = 'training_' + (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 8);
    // file path
    const tmpFilePath: string = path.join(dir_desktop, formattedDate);
    // initialize
    await scraper.init();
    // goto netkeiba
    await scraper.doGo(myConst.BASE_AUTH_URL);
    logger.debug(`goto ${myConst.BASE_AUTH_URL}`);
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
    for await (const [idx, _] of Object.entries(raceNoData.no)) {
      // course name
      let targetCourseName: string;
      // finaljson
      let finalJsonArray: any[] = [];
      // initialize success counter
      successCounter = 0;
      // initialize fail counter
      failCounter = 0;
      // index
      const targetIdx: number = Number(idx);
      // get date
      const localLanguage: string = await keytar.getPassword('language', 'admin') ?? 'japanese';
      // switch language
      if (localLanguage == 'japanese') {
        // set japanese racing cource
        targetCourseName = raceNoData.place[targetIdx];
      } else {
        // set english racing cource
        targetCourseName = myRaces.RACES[raceNoData.place[targetIdx]];
      }
      // course name
      const targetRaceId: string = raceNoData.no[targetIdx];
      // base url
      const baseUrl: string = `${myConst.TRAINING_BASE_URL}?race_id=${targetRaceId}`;
      // csv filename
      const filePath: string = `${tmpFilePath}_${targetCourseName}.csv`;
      // send totalWords
      event.sender.send("total", {
        len: 12, // the number of race
        place: date + targetCourseName, // racing course
      });

      // loop each races
      for await (let j of racenums) {
        try {
          // tmpJsonArray
          let tmpJsonArray: any[] = [];
          // url
          const targetUrl: string = `${baseUrl}${String(j).padStart(2, '0')}${myConst.DEF_URL_QUERY}`;
          // goto site
          await scraper.doGo(targetUrl);
          logger.debug(`scraping ${targetUrl}`);
          // wait for datalist
          await scraper.doWaitFor(3000);
          // for loop
          const horsenums: number[] = [...Array(18)].map((_, i) => i + 1);
          // loop each horses
          for await (let i of horsenums) {
            try {
              // empty array
              let tmpObj: { [key: string]: string } = {
                race: '', // race
                horse: '', // horse name
                date: '', // date
                place: '', // training center
                condition: '', // field condition
                strength: '', // training strength
                review: '', // review comment
                lap1: '', // lap time
                lap2: '', // lap time
                lap3: '', // lap time
                lap4: '', // lap time
                lap5: '', // lap time
                color1: '', // training color
                color2: '', // training color
                color3: '', // training color
                color4: '', // training color
                color5: '', // training color
              };
              await scraper.doWaitFor(1000);
              // no element break
              if (!await scraper.doCheckSelector(`.OikiriDataHead${i} .Horse_Info .Horse_Name a`)) {
                break;
              }
              const postArray: any = await Promise.all([
                // race no
                String(j),
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

              // not empty
              if (postArray.length > 0) {
                // set each value
                tmpObj.race = postArray[0];
                tmpObj.horse = postArray[1];
                tmpObj.date = postArray[2];
                tmpObj.place = postArray[3];
                tmpObj.condition = postArray[4];
                tmpObj.strength = postArray[5];
                tmpObj.review = postArray[6];
                tmpObj.lap1 = postArray[7][0];
                tmpObj.lap2 = postArray[7][1];
                tmpObj.lap3 = postArray[7][2];
                tmpObj.lap4 = postArray[7][3];
                tmpObj.lap5 = postArray[7][4];
                tmpObj.color1 = postArray[8][0];
                tmpObj.color2 = postArray[8][1];
                tmpObj.color3 = postArray[8][2];
                tmpObj.color4 = postArray[8][3];
                tmpObj.color5 = postArray[8][4];
                // set to json
                tmpJsonArray.push(tmpObj);

              } else {
                // set empty to json
                tmpJsonArray.push(tmpObj);
              }

            } catch (e) {
              logger.error(e);
              break;
            }
          }
          // increment success counter
          successCounter++;
          // add resut jsons
          finalJsonArray.push(tmpJsonArray);

        } catch (err2: unknown) {
          // error
          logger.error(err2);
          // increment fail counter
          failCounter++;

        } finally {
          // send success
          event.sender.send("success", successCounter);
          // send fail
          event.sender.send("fail", failCounter);
        }
      }
      // write data
      await csvMaker.makeCsvData(finalJsonArray.flat(), trainingColumns, filePath);
      logger.info(`csv completed.`);
      // get language
      const language = await keytar.getPassword('language', 'admin') ?? 'japanese';
      // switch on language
      if (language == 'japanese') {
        // set finish message
        endmessage = '完了しました。';
      } else {
        // set finish message
        endmessage = 'completed';
      }
      // end message
      dialogMaker.showmessage('info', endmessage);
      await scraper.doWaitFor(1500);
    }

  } catch (e: unknown) {
    logger.error(e);
  }
});

// post communication
const httpsPost = async (
  hostname: string,
  data: any,
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    // post
    axios
      .post(hostname, data, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response: any) => {
        // data
        const targetData: any = response.data;

        // recieved data
        if (targetData != "error") {
          // complete
          resolve(targetData);
        } else {
          // error
          throw new Error("data is invalid");
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          // error message
          dialogMaker.showmessage("error", err.message);
          // reject
          reject("httpsPost error");
        }
      });
  });
};