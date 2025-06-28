/**
 * getkeiba.ts
 *
 * getkeiba - Getting keiba data from netkeiba. -
**/

'use strict';

/// Constants
// name space
import { myConst, myUrls, mySelectors, myRaces } from './consts/globalvariables';

/// Modules
import * as path from 'node:path'; // path
import axios from 'axios'; // http
import { autoUpdater } from 'electron-updater'; // updater
import { existsSync } from 'node:fs'; // filesystem
import { writeFile } from 'node:fs/promises'; // filesystem
import { config as dotenv } from 'dotenv'; // dotenv
import { BrowserWindow, app, ipcMain, Tray, Menu, nativeImage } from 'electron'; // electron
import { Scrape } from './class/ElScrape0531'; // custom Scraper
import ELLogger from './class/ElLogger'; // logger
import Dialog from './class/ElDialog0414'; // dialog
import Crypto from './class/Crypto0616'; // crypto
import CSV from './class/ElCsv0414'; // aggregator
import SQLite from './class/ElSQLite'; // sqlite
import MKDir from './class/ElMkdir0414'; // mdkir
// env setting
dotenv({ path: path.join(__dirname, '..', '.env') });
// db operation
let sqliteMaker: SQLite;
// desktop path
const dir_home =
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'] ?? '';
const dir_desktop = path.join(dir_home, 'Desktop');
// log level
const logLevel: string = myConst.LOG_LEVEL ?? 'all';
// loggeer instance
const logger: ELLogger = new ELLogger(myConst.COMPANY_NAME, myConst.APP_NAME, logLevel);
// scraper
const scraper = new Scrape(logger);
// mkdir
const mkdirManager = new MKDir(logger);
// aggregator
const csvMaker = new CSV(myConst.CSV_ENCODING, logger);
// crypto
const cryptoMaker: Crypto = new Crypto(logger, myConst.FIX_SECRET, process.env.PEPPER);
// dialog
const dialogMaker: Dialog = new Dialog(logger);

// window option
interface windowOption {
  width: number; // window width
  height: number; // window height
  defaultEncoding: string; // default encode
  webPreferences: Object; // node
}

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
      width: myConst.WINDOW_WIDTH, // window width
      height: myConst.WINDOW_HEIGHT, // window height
      defaultEncoding: myConst.DEFAULT_ENCODING, // encoding
      webPreferences: {
        nodeIntegration: false, // node
        contextIsolation: true, // isolate
        preload: path.join(__dirname, 'preload.js'), // preload
      }
    }
    // Electron window
    mainWindow = new BrowserWindow(windowOptions);
    // hide menubar
    mainWindow.setMenuBarVisibility(false);
    // load index.html
    mainWindow.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
    // ready
    mainWindow.once('ready-to-show', async () => {
      // dev mode
      mainWindow.webContents.openDevTools();
    });

    // minimize and stay on tray
    mainWindow.on('minimize', (event: any): void => {
      // cancel double click
      event.preventDefault();
      // hide window
      mainWindow.hide();
      // return false
      event.returnValue = false;
    });

    // close
    mainWindow.on('close', (event: any): void => {
      // not quitting
      if (!isQuiting) {
        // except for apple
        if (process.platform !== 'darwin') {
          // quit
          app.quit();
          // return false
          event.returnValue = false;
        }
      }
    });

    // when close
    mainWindow.on('closed', (): void => {
      // destryo window
      mainWindow.destroy();
    });

    // open sub window
    ipcMain.handle('open-window', () => {
      // sub window
      const subWindow = new BrowserWindow({
        title: 'Sub Window',
      });
      // set sub window
      subWindow.loadFile(path.join(__dirname, '..', 'www', 'scrape.html'));
    });

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // show error
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }
};

// enable sandbox
app.enableSandbox();

// avoid double ignition
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // show error message
  dialogMaker.showmessage('error', 'Double ignition. break.');
  // close app
  app.quit();
}

// ready
app.on('ready', async () => {
  logger.info('app: electron is ready');
  // display label
  let displayLabel: string = '';
  // cloase label
  let closeLabel: string = '';
  // initialize key
  let tmpInitkey: string = '';
  // initialize key salt
  let tmpInitsalt: string = '';
  // make window
  createWindow();
  // db dir
  const dbDirPath: string = path.join(__dirname, '..', 'db');
  // db file
  const fixedDbPath: string = path.join(dbDirPath, 'database.db');
  // makedir
  await mkdirManager.mkDir(dbDirPath);
  // not exists
  if (!existsSync(fixedDbPath)) {
    logger.debug('app: making db ...');
    // make empty file
    await writeFile(fixedDbPath, '');
  }
  // sqlite
  sqliteMaker = new SQLite(logger, fixedDbPath, 'user', ['id', 'userkey', 'initkey', 'initsalt', 'mail', 'password', 'passiv', 'language', 'token', 'tokensalt', 'authenticated', 'created_at', 'updated_at'], ['INTEGER', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'TEXT', 'INTEGER', 'TEXT', 'TEXT']);
  // check update
  //autoUpdater.checkForUpdatesAndNotify();

  // if empty
  if (!sqliteMaker.selectDB()[0]) {
    logger.debug('app: initializing db ...');
    // get now time
    const nowTime: string = getNowTime();
    // insert initial data
    sqliteMaker.insertDB([1, '', '', '', '', '', '', '', '', '', 0, nowTime, nowTime]);
  }
  // authorized flg
  const tmpAuthorized: number = sqliteMaker.selectDB()[0].authenticated ?? 0;
  // authorized
  if (tmpAuthorized == 1) {
    logger.debug('app: inserting first data ...');
    // initialize key
    tmpInitkey = sqliteMaker.selectDB()[0].initkey ?? '';
    // initialize key salt
    tmpInitsalt = sqliteMaker.selectDB()[0].initsalt ?? '';
    // initkey not exists
    if (tmpInitkey == '' || tmpInitsalt == '') {
      // hash
      const initkeyObj: any = cryptoMaker.genPassword(process.env.ACCESS_KEY!);
      // update initkey
      sqliteMaker.updateDB(['initkey', 'initsalt'], [initkeyObj.hash, initkeyObj.salt], ['id'], [1]);
      // set key
      tmpInitkey = initkeyObj.hash;
      // set salt
      tmpInitsalt = initkeyObj.salt;
    }
    // token key
    const tmpToken: string = sqliteMaker.selectDB()[0].token ?? '';
    // token key salt
    const tmpTokenSalt: string = sqliteMaker.selectDB()[0].tokensalt ?? '';
    // get authorized
    const authorized: any = await httpsPost('https://keiba.numthree.net/auth/authorize',
      {
        initkey: tmpInitkey,
        initsalt: tmpInitsalt,
        token: tmpToken,
        tokensalt: tmpTokenSalt,
      });
    // update initkey
    sqliteMaker.updateDB(['userkey'], [authorized], ['id'], [1]);
  }
  // language
  const initlanguage = sqliteMaker.selectDB()[0].language;

  // switch on language
  if (initlanguage == 'japanese') {
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
    path.join(__dirname, 'assets', 'keiba128.ico')
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
  mainTray.on('double-click', () => mainWindow.show());

});

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

// activated
app.on('activate', async () => {
  // no window
  if (BrowserWindow.getAllWindows().length === 0) {
    // reboot
    createWindow();
  }
});

// quit button
app.on('before-quit', () => {
  // flg on
  isQuiting = true;
});

// closed
app.on('window-all-closed', () => {
  logger.info('app: close app');
  // quit
  app.quit();
});

/* IPC */
// beready
ipcMain.on('beready', () => {
  // language
  const initlanguage = sqliteMaker.selectDB()[0].language;
  // be ready
  mainWindow.send('ready', initlanguage);
});

// restart
ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

// config
ipcMain.on('config', async (_, arg: any) => {
  logger.info('app: config app');
  // language
  const language = sqliteMaker.selectDB()[0].language ?? 'japanese';
  // goto config page
  await mainWindow.loadFile(path.join(__dirname, '..', 'www', 'config.html'));
  // language
  mainWindow.send('confready', language);
});

// save
ipcMain.on('save', async (_, arg: any) => {
  logger.info('app: save config');
  // language
  const language: string = String(arg.language);
  // mail
  const userMail: string = String(arg.mail);
  // password
  const userPass: string = String(arg.password);
  console.log(language);
  // if not empty
  if (userMail != '' && userPass != '') {
    logger.debug('app: input is empty');
    // encrypt
    const encrypted: any = cryptoMaker.encrypt(userPass);
    // update password
    sqliteMaker.updateDB(['mail', 'password', 'passiv'], [userMail, encrypted.encrypted, encrypted.iv], ['id'], [1]);
  }
  // update language
  sqliteMaker.updateDB(['language'], [language], ['id'], [1]);
  // goto config page
  await mainWindow.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
  // language
  mainWindow.send('topready', language);
});

// auth
ipcMain.on('auth', async (_, arg: any) => {
  logger.info('app: auth');
  // token
  const userToken: string = String(arg);
  // hash
  const tokenObj: any = await cryptoMaker.genPassword(userToken);
  // key
  const initKey = sqliteMaker.selectDB()[0].initkey;
  // key
  const initSalt = sqliteMaker.selectDB()[0].initsalt;
  // pass encryption
  const authResult: any = await httpsPost('https://keiba.numthree.net/auth/authkey', {
    token: tokenObj.hash,
    tokensalt: tokenObj.salt,
    initsalt: initSalt,
    initkey: initKey,
  });
  // auth
  mainWindow.send('authresult', authResult);
});

// top
ipcMain.on('top', async (_, arg: any) => {
  logger.info('app: top');
  // goto config page
  await mainWindow.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
  // language
  const language = sqliteMaker.selectDB()[0].language;
  // language
  mainWindow.send('topready', language);
});

// exit
ipcMain.on('exitapp', async (_, __) => {
  logger.info('app: exit app');
  // excrpt for apple
  if (process.platform !== 'darwin') {
    // exit app
    app.quit();
    return false;
  }
});

// error
ipcMain.on('error', async (_, arg: any) => {
  logger.info('ipc: error mode');
  // show error
  dialogMaker.showmessage('error', `${arg})`);
});

// get horse sire
ipcMain.on('sire', async (event: any, arg: any) => {
  try {
    logger.info('sire: getsire mode');
    // success Counter
    let successCounter: number = 0;
    // fail Counter
    let failCounter: number = 0;
    // status message
    let statusmessage: string;
    // finish message
    let endmessage: string;
    // result array
    let resultArray: any[] = [];
    // selector array
    const selectorArray: string[] = [mySelectors.TURF_SELECTOR, mySelectors.TURF_WIN_SELECTOR, mySelectors.DIRT_SELECTOR, mySelectors.DIRT_WIN_SELECTOR, mySelectors.TURF_DIST_SELECTOR, mySelectors.DIRT_DIST_SELECTOR];
    // language
    const language = sqliteMaker.selectDB()[0].language;
    // stallion data
    const stallionData: any = await httpsPost('https://keiba.numthree.net/horse/getstallion', {});
    // extract first column
    const horses: string[] = stallionData.map((item: any) => item.horsename);
    // extract second column
    const urls: string[] = stallionData.map((item: any) => item.url);

    // initialize
    await scraper.init();
    logger.debug('sire: initialize end');

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
        // url
        const sireUrl: string = myUrls.SIRE_BASE_URL + urls[i];
        // insert horse name
        tmpObj.horse = horses[i];

        // goto page
        await scraper.doGo(sireUrl);
        // wait for selector
        await scraper.doWaitFor(3000);
        logger.debug(`sire: goto ${sireUrl}`);
        // send totalWords
        event.sender.send('total', { len: urls.length, place: horses[i] });
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
              logger.debug('sire: no selector');
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
        event.sender.send('success', successCounter);
        // send fail
        event.sender.send('fail', failCounter);
      }
    }
    logger.debug('sire: making csv ...');
    // csv header
    const csvColumnArray: string[] = ['horse', 'turf', 'turfwin', 'dirt', 'dirtwin', 'turfdistanse', 'dirtdistanse',];
    // today date
    const formattedDate: string = 'sire_' + getNowDate();
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
    logger.info('sire: getsire completed.');

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// get horse training
ipcMain.on('training', async (event: any, arg: any) => {
  try {
    logger.info('training: gettraining mode');
    // success Counter
    let successCounter: number = 0;
    // fail Counter
    let failCounter: number = 0;
    // status message
    let statusmessage: string;
    // finish message
    let endmessage: string;
    // error message
    let racingErrorMsg: string;
    // get language
    const language = sqliteMaker.selectDB()[0].language;
    // race data
    const raceNoData: any = await httpsPost('https://keiba.numthree.net/race/getracingno', { date: getNowDate() });
    logger.debug(raceNoData);
    // empty
    if (raceNoData.no.length == 0) {
      // switch language
      if (language == 'japanese') {
        // japanese error
        racingErrorMsg = '開催日ではありません';
      } else {
        // english error
        racingErrorMsg = 'not the racing date';
      }
      // error
      throw new Error(racingErrorMsg);
    }
    // header
    const trainingColumns: string[] = ['race', 'horse', 'date', 'place', 'condition', 'strength', 'review', 'lap1', 'lap2', 'lap3', 'lap4', 'lap5', 'color1', 'color2', 'color3', 'color4', 'color5'];
    // for race loop
    const racenums: number[] = [...Array(12)].map((_, i) => i + 1);
    // formatted date
    const formattedDate: string = 'training_' + getNowDate();
    // file path
    const tmpFilePath: string = path.join(dir_desktop, formattedDate);
    // initialize
    await scraper.init();
    // goto netkeiba
    await scraper.doGo(myUrls.BASE_AUTH_URL);
    logger.debug(`training: goto ${myUrls.BASE_AUTH_URL}`);
    // wait for id/pass input
    await scraper.doWaitFor(3000);
    // tmp netkeiba id
    const netKeibaId: string = sqliteMaker.selectDB()[0].mail ?? '';
    // tmp netkeiba password
    const tmpPass: string = sqliteMaker.selectDB()[0].password ?? '';
    // tmp netkeiba password iv
    const tmpPassIv: string = sqliteMaker.selectDB()[0].passiv ?? '';
    // decrpyt password
    const netKeibaPass: string = await cryptoMaker.decrypt(tmpPass, tmpPassIv);
    // input id
    await scraper.doType("input[name='login_id']", netKeibaId);
    // input pass
    await scraper.doType("input[name='pswd']", netKeibaPass);
    // wait 3 sec
    await scraper.doWaitFor(3000);
    // click login button
    await scraper.doClick('.loginBtn__wrap input');
    // wait 3 sec
    await scraper.doWaitFor(3000);

    // loop each races
    for await (const [idx, _] of Object.entries(raceNoData.no)) {
      // course name
      let targetCourseName: string = '';
      // finaljson
      let finalJsonArray: any[] = [];
      // initialize success counter
      successCounter = 0;
      // initialize fail counter
      failCounter = 0;
      // index
      const targetIdx: number = Number(idx);
      // switch language
      if (language == 'japanese') {
        // set japanese racing cource
        targetCourseName = raceNoData.place[targetIdx];
      } else {
        // set english racing cource
        targetCourseName = myRaces.RACES[raceNoData.place[targetIdx]];
      }
      // course name
      const targetRaceId: string = raceNoData.no[targetIdx];
      // base url
      const baseUrl: string = `${myUrls.TRAINING_BASE_URL}?race_id=${targetRaceId}`;
      // csv filename
      const filePath: string = `${tmpFilePath}_${targetCourseName}.csv`;
      // send totalWords
      event.sender.send('total', {
        len: 12, // the number of race
        place: getNowDate() + targetCourseName, // racing course
      });

      // loop each races
      for await (let j of racenums) {
        try {
          // tmpJsonArray
          let tmpJsonArray: any[] = [];
          // url
          const targetUrl: string = `${baseUrl}${String(j).padStart(2, '0')}${myUrls.DEF_URL_QUERY}`;
          // goto site
          await scraper.doGo(targetUrl);
          logger.debug(`training: scraping ${targetUrl}`);
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
              // do all scraping
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
          event.sender.send('success', successCounter);
          // send fail
          event.sender.send('fail', failCounter);
        }
      }
      // write data
      await csvMaker.makeCsvData(finalJsonArray.flat(), trainingColumns, filePath);
      logger.info('training: csv completed.');
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
      dialogMaker.showmessage('error', e.message);
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
          'Content-Type': 'application/json',
        },
      })
      .then((response: any) => {
        // data
        const targetData: any = response.data;

        // recieved data
        if (targetData != 'error') {
          // complete
          resolve(targetData);
        } else {
          // error
          throw new Error('data is invalid');
        }
      })
      .catch((err: unknown) => {
        logger.error(err);
        // error
        if (err instanceof Error) {
          // error message
          dialogMaker.showmessage('error', err.message);
          // reject
          reject('httpsPost error');
        }
      });
  });
};

// get now time
const getNowTime = (): string => {
  // get now time
  return new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replaceAll('/', '-');
}

// get now date
const getNowDate = (): string => {
  // get now time
  return new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replaceAll('/', '-');
}