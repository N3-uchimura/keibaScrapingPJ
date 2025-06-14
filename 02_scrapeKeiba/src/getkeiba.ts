/**
 * getkeiba.ts
 *
 * getkeiba - Getting keiba data from netkeiba. -
**/

"use strict";

/// Constants
// name space
import { myConst, mySelectors, myRaces } from './consts/globalvariables';
const WINDOW_WIDTH: number = 1000; // window width
const WINDOW_HEIGHT: number = 1000; // window height

/// Modules
import * as path from 'node:path'; // path
import { existsSync } from 'node:fs'; // filesystem
import { readFile, writeFile, readdir, stat, utimes } from 'node:fs/promises'; // filesystem
import * as mime from 'mime-types'; // mime
import dayjs from 'dayjs'; // dayjs
import axios from "axios"; // http
import { BrowserWindow, app, ipcMain, Tray, Menu, nativeImage } from "electron"; // electron
import { config as dotenv } from 'dotenv'; // dotenv
import { Scrape } from './class/ElScrape0531'; // custom Scraper
import ELLogger from './class/ElLogger'; // logger
import Dialog from './class/ElDialog0414'; // dialog
import Crypto from './class/Crypto0518'; // crypto
import CSV from './class/ElCsv0414'; // aggregator
import MKDir from './class/ElMkdir0414'; // mdkir
import NodeCache from "node-cache"; // node-cache

// dotenv
dotenv({ path: path.join(__dirname, '../man.env') });
// desktop path
const dir_home =
  process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"] ?? "";
const dir_desktop = path.join(dir_home, "Desktop");
// log level
const LOG_LEVEL: string = myConst.LOG_LEVEL ?? 'all';
// loggeer instance
const logger: ELLogger = new ELLogger(myConst.APP_NAME, LOG_LEVEL);
// scraper
const scraper = new Scrape(logger);
// mkdir
const mkdirManager = new MKDir(logger);
// aggregator
const csvMaker = new CSV(myConst.CSV_ENCODING, logger);
// crypto
const cryptoMaker: Crypto = new Crypto(logger);
// dialog
const dialogMaker: Dialog = new Dialog(logger);
// cache
const cacheMaker: NodeCache = new NodeCache();
// ID
const NETKEIBA_ID: string = process.env.NETKEIBA_ID!;
// PASS
const NETKEIBA_PASS: string = process.env.NETKEIBA_PASS!;

/// interfaces
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

/*
 main
*/
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
      //mainWindow.webContents.openDevTools();
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
    logger.error(e);
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
  // env path
  /*
  const envfilePath: string = path.join(__dirname, "..", ".env");
  // ifnot exists make .env
  if (!existsSync(envfilePath)) {
    await utimes(envfilePath, new Date(), new Date());
  } else {
    // clean up
    await writeFile(envfilePath, '');
  }
  dotenv({ path: envfilePath }); // env
  // key
  const initKey = await readFile(path.join(__dirname, "..", "assets", "init.txt"), "utf8");
  // get secretkey
  const secretKey: any = await httpsPost('https://keiba.numthree.net/auth/getsecretkey', { key: initKey });
  // get secretiv
  const secretKeyIv: any = await httpsPost('https://keiba.numthree.net/auth/getsecretiv', { key: initKey });
  // get secret
  const secret: string = await cryptoMaker.decrypt(secretKey, secretKeyIv);
  // write to .env
  await writeFile(envfilePath, `SECRET=${secret}`);
  */
  // get language
  const language = cacheMaker.get('language') ?? 'japanese';
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
  const initlanguage = await readFile(path.join(__dirname, "..", "assets", "language.txt"), "utf8");
  // key
  const initKey = await readFile(path.join(__dirname, "..", "assets", "init.txt"), "utf8");
  // pass encryption
  const keyResult: any = await httpsPost('https://keiba.numthree.net/auth/getsecretwd', {
    key: initKey,
  });
  // set secret
  cacheMaker.set('secretkey', keyResult.wd);
  // language
  cacheMaker.set('language', initlanguage);
  // be ready
  mainWindow.send("ready", initlanguage);
});

// config
ipcMain.on("config", async (_, arg: any) => {
  logger.info("app: config app");
  // language
  const language = cacheMaker.get('language') ?? 'japanese';
  // goto config page
  await mainWindow.loadFile(path.join(__dirname, "../config.html"));
  // language
  mainWindow.send("confready", language);
});

// save
ipcMain.on("save", async (_, arg: any) => {
  logger.info("app: save config");
  // language
  const language: string = String(arg.language);
  // mail
  const userMail: string = String(arg.mail);
  // password
  const userPass: string = String(arg.password);
  // if not empty
  if (userMail != '' && userPass != '') {
    // encrypt
    const encrypted: any = cryptoMaker.encrypt(userPass);
    // combine mail and iv
    const writeText: string = userMail + "," + encrypted.iv;
    // save
    await writeFile(path.join(__dirname, "..", "assets", "user.txt"), writeText);
    // env path
    const envfilePath: string = path.join(__dirname, "..", ".env");
    // write to .env
    await writeFile(envfilePath, `PASS=${encrypted.encrypted}`);
  }
  // save
  await writeFile(path.join(__dirname, "..", "assets", "language.txt"), language);
  // language
  cacheMaker.set('language', language);
  // goto config page
  await mainWindow.loadFile(path.join(__dirname, "../index.html"));
  // language
  mainWindow.send("topready", language);
});

// auth
ipcMain.on("auth", async (_, arg: any) => {
  logger.info("app: auth");
  // token
  const userToken: string = String(arg.key);
  // secret
  const authSecret: string = cacheMaker.get('secretkey')!;
  // key
  const initKey = await readFile(path.join(__dirname, "..", "assets", "init.txt"), "utf8");
  // pass encryption
  const authResult: any = await httpsPost('https://keiba.numthree.net/auth/authkey', {
    token: userToken,
    key: initKey,
    word: authSecret,
  });
  // language
  mainWindow.send("authresult", authResult);
});

// top
ipcMain.on("top", async (_, arg: any) => {
  logger.info("app: top");
  // goto config page
  await mainWindow.loadFile(path.join(__dirname, "../index.html"));
  // language
  const language = cacheMaker.get('language') ?? 'japanese';
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
    // status message
    let statusmessage: string;
    // finish message
    let endmessage: string;
    // language
    const language = cacheMaker.get('language') ?? 'japanese';
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
    event.sender.send("total", { len: records.length });

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
          // switch on language
          if (language == 'japanese') {
            // set finish message
            statusmessage = '種牡馬URL取得中...';
          } else {
            // set finish message
            statusmessage = 'Getting stallion urls...';
          }
          // URL
          event.sender.send('statusUpdate', {
            status: statusmessage,
            target: tmpObj.horse
          });
          // increment success
          successCounter++;
        } else {
          // increment fail
          failCounter++;
        }
        // send success
        event.sender.send("success", successCounter);
        // send fail
        event.sender.send("fail", failCounter);

      } catch (err: unknown) {
        logger.error(err);
        // increment fail
        failCounter++;

      } finally {
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
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage("error", e.message);
    }
  }
});

// get horse sire
ipcMain.on("presire", async (event: any, _) => {
  try {
    logger.info("ipc: presire mode");
    // make dir
    mkdirManager.mkDir('csv');
    // date
    let fixedDates: any[] = [];
    // promises
    let promises: Promise<any>[] = [];
    // dir path
    const dirPath: string = path.join(__dirname, '../csv');
    // files
    const files: any = await readdir(dirPath);
    // extract csv
    const csvFiles: any = files.filter((file: any) => mime.lookup(path.extname(file)) == 'text/csv');
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
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage("error", e.message);
    }
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
    // status message
    let statusmessage: string;
    // finish message
    let endmessage: string;
    // language
    const language = cacheMaker.get('language') ?? 'japanese';
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
        event.sender.send("total", { len: urls.length, place: horses[i] });
        // switch on language
        if (language == 'japanese') {
          // set finish message
          statusmessage = '種牡馬産駒成績取得中...';
        } else {
          // set finish message
          statusmessage = 'Getting crops results...';
        }
        // URL
        event.sender.send('statusUpdate', {
          status: statusmessage,
          target: tmpObj.horse
        });

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

          } catch (err: unknown) {
            logger.error(err);
          }
        }
        // add to result array
        resultArray.push(tmpObj);
        // increment success
        successCounter++;

      } catch (error: unknown) {
        logger.error(error);
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
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage("error", e.message);
    }
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
    cacheMaker.set('date', arg);
    // status message
    let statusmessage: string;
    // finish message
    let endmessage: string;
    // get language
    const language = cacheMaker.get('language') ?? 'japanese';
    // formattedDate
    const dateString: string = (new Date).toISOString().slice(0, 10);
    // get date
    const date: string = cacheMaker.get('date') ?? dateString;
    // race data
    const raceNoData: any = await httpsPost('https://keiba.numthree.net/race/getracingno', { date: date });
    logger.debug(raceNoData);
    // empty
    if (raceNoData.no.length == 0) {
      // error message
      let racingErrorMsg: string;
      // get language
      const language = cacheMaker.get('language') ?? 'japanese';
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
    // user text path
    /*const userTxtPath: string = path.join(__dirname, "..", "assets", "user.txt");
    // ifnot exists make .env
    if (!existsSync(userTxtPath)) {
      throw new Error("txt file is invalid");
    }
    // key
    const userInfo: string = await readFile(path.join(__dirname, "..", "assets", "user.txt"), "utf8");
    // not empty
    if (userInfo == '') {
      throw new Error("txt file is invalid");
    }
    // split text
    const userInfoArray: string[] = userInfo.split(',');
    // netkeiba id
    const netKeibaId: string = userInfoArray[0];
    // tmp netkeiba password
    const tmpPass: string = process.env.PASS!;
    // decrpyt password
    const netKeibaPass: string = await cryptoMaker.decrypt(tmpPass, userInfoArray[1]);
    */
    console.log(NETKEIBA_ID);
    console.log(NETKEIBA_PASS);
    // input id
    await scraper.doType('input[name="login_id"]', NETKEIBA_ID);
    // input pass
    await scraper.doType('input[name="pswd"]', NETKEIBA_PASS);
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
      // get language
      const localLanguage = cacheMaker.get('language') ?? 'japanese';
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
              // switch on language
              if (language == 'japanese') {
                // set finish message
                statusmessage = `${targetCourseName} 調教取得中...`;
              } else {
                // set finish message
                statusmessage = `Getting ${targetCourseName} Training...`;
              }
              // URL
              event.sender.send('statusUpdate', {
                status: statusmessage,
                target: `${String(j)}R`
              });
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

            } catch (err: unknown) {
              logger.error(err);
              break;
            }
          }
          // increment success counter
          successCounter++;
          // add resut jsons
          finalJsonArray.push(tmpJsonArray);

        } catch (error: unknown) {
          // error
          logger.error(error);
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
      await scraper.doWaitFor(1500);
    }
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

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage("error", e.message);
    }
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
        logger.error(err);
        // error
        if (err instanceof Error) {
          // error message
          dialogMaker.showmessage("error", err.message);
          // reject
          reject("httpsPost error");
        }
      });
  });
};