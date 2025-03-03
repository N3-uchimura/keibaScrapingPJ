/**
/* getCropsData.ts
/* getCropsData - Getting shuboba crops data. -
**/
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//* Constants
const WINDOW_WIDTH = 1000; // window width
const WINDOW_HEIGHT = 1000; // window height
const DEFAULT_ENCODING = 'utf8'; // encoding
const CSV_ENCODING = 'Shift_JIS'; // csv encoding
const TARGET_URL = 'https://db.netkeiba.com/horse/sire/'; // base url
const BASE_SELECTOR = '#contents > div > table > tbody > tr:nth-child(3) >'; // base
const TURF_SELECTOR = `${BASE_SELECTOR} td:nth-child(13) > a`; // turf
const TURF_WIN_SELECTOR = `${BASE_SELECTOR} td:nth-child(14) > a`; // turf win
const DIRT_SELECTOR = `${BASE_SELECTOR} td:nth-child(15) > a`; // dirt
const DIRT_WIN_SELECTOR = `${BASE_SELECTOR} td:nth-child(16) > a`; // dirt win
const TURF_DIST_SELECTOR = `${BASE_SELECTOR} td:nth-child(20)`; // turf average distance
const DIRT_DIST_SELECTOR = `${BASE_SELECTOR} td:nth-child(21)`; // dirt average distance
//* Modules
const electron_1 = require("electron"); // electron
const fs = __importStar(require("fs")); // fs
const path = __importStar(require("path")); // path
const sync_1 = __importDefault(require("csv-parse/lib/sync")); // csv parser
const sync_2 = __importDefault(require("csv-stringify/lib/sync")); // csv stfingifier
const iconv_lite_1 = __importDefault(require("iconv-lite")); // Ttext converter
const Scrape1102_1 = require("./class/Scrape1102"); // scraper
//* General variables
// main window
let mainWindow = null;
// result array
let resultArray = [];
// selector array
const selectorArray = [TURF_SELECTOR, TURF_WIN_SELECTOR, DIRT_SELECTOR, DIRT_WIN_SELECTOR, TURF_DIST_SELECTOR, DIRT_DIST_SELECTOR];
// horse array
const horseDataArray = ['turf', 'turfwin', 'dirt', 'dirtwin', 'turfdistanse', 'dirtdistanse'];
// scraper
const scraper = new Scrape1102_1.Scrape();
// main
electron_1.app.on('ready', async () => {
    // window options
    const windowOptions = {
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        defaultEncoding: DEFAULT_ENCODING,
        webPreferences: {
            nodeIntegration: false, // node
        }
    };
    // Electron window
    mainWindow = new electron_1.BrowserWindow(windowOptions);
    // output dir
    const outputDirPath = path.join(__dirname, 'output');
    // if exists make dir
    if (!fs.existsSync(outputDirPath)) {
        fs.promises.mkdir(outputDirPath).then(() => {
            console.log('Directory created successfully');
        }).catch(() => {
            console.log('failed to create directory');
        });
    }
    // csv file dialog
    const promise = new Promise((resolve, reject) => {
        // get csv
        getCsvData()
            // success
            .then((res) => {
            // chosen filename
            const filename = res[0];
            // resolved
            resolve(filename);
        })
            // error
            .catch((e) => {
            // error
            outErrorMsg(e, 1);
            // error message
            showDialog('no file', 'no csv file selected', e, true);
            // rejected
            reject();
            // close window
            mainWindow.close();
        });
    });
    // file reading
    promise.then((name) => {
        try {
            // read file
            fs.readFile(name, async (err, data) => {
                // error
                if (err)
                    throw err;
                // initialize
                await scraper.init();
                console.log(`scraping ${name}..`);
                // decoder
                const str = iconv_lite_1.default.decode(data, CSV_ENCODING);
                // format date
                const formattedDate = (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 14);
                // options
                const recordOptions = {
                    columns: ['horse', 'urls'],
                    from_line: 2, // from line 2
                };
                // csv reading
                const tmpRecords = (0, sync_1.default)(str, recordOptions);
                // extract first column
                const urls = tmpRecords.map(item => item.urls);
                const horses = tmpRecords.map(item => item.horse);
                // loop words
                for (let i = 0; i < urls.length; i++) {
                    try {
                        // empty array
                        let tmpObj = {
                            horse: '',
                            turf: '',
                            turfwin: '',
                            dirt: '',
                            dirtwin: '',
                            turfdistanse: '',
                            dirtdistanse: '', // dirt average distance
                        };
                        // insert horse name
                        tmpObj.horse = horses[i];
                        // goto page
                        await scraper.doGo(TARGET_URL + urls[i]);
                        console.log(`goto ${TARGET_URL + urls[i]}`);
                        // wait for selector
                        await scraper.doWaitFor(3000);
                        // get data
                        for (let j = 0; j < selectorArray.length; j++) {
                            try {
                                if (await scraper.doCheckSelector(selectorArray[j])) {
                                    // wait for selector
                                    await scraper.doWaitFor(200);
                                    // acquired data
                                    const scrapedData = await scraper.doSingleEval(selectorArray[j], 'textContent');
                                    // data exists
                                    if (scrapedData != '') {
                                        tmpObj[horseDataArray[j]] = scrapedData;
                                    }
                                    // wait for 100ms
                                    await scraper.doWaitFor(200);
                                }
                                else {
                                    console.log('no selector');
                                }
                            }
                            catch (e) {
                                console.log(e);
                            }
                        }
                        console.log(tmpObj);
                        resultArray.push(tmpObj);
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                console.log(resultArray);
                const csvHeadObj = {
                    horse: 'horse',
                    turf: 'turf',
                    turfwin: 'turfwin',
                    dirt: 'dirt',
                    dirtwin: 'dirtwin',
                    turfdistanse: 'turfdistanse',
                    dirtdistanse: 'dirtdistanse', // dirt distanse
                };
                // stringify option
                const stringifyOptions = {
                    header: true,
                    columns: csvHeadObj,
                };
                // export csv
                const csvString = (0, sync_2.default)(resultArray, stringifyOptions);
                // output csv file
                fs.writeFileSync(`output/${formattedDate}.csv`, csvString);
                // close window
                mainWindow.close();
            });
        }
        catch (e) {
            // error
            outErrorMsg(e, 2);
        }
    });
    // closing
    mainWindow.on('closed', () => {
        // release window
        mainWindow = null;
    });
});
// choose csv data
const getCsvData = () => {
    return new Promise((resolve, reject) => {
        // options
        const dialogOptions = {
            properties: ['openFile'],
            title: 'choose csv file',
            defaultPath: '.',
            filters: [
                { name: 'csv(Shif-JIS)', extensions: ['csv'] } // filter
            ],
        };
        // show file dialog
        electron_1.dialog.showOpenDialog(mainWindow, dialogOptions).then((result) => {
            // file exists
            if (result.filePaths.length > 0) {
                // resolved
                resolve(result.filePaths);
                // no file
            }
            else {
                // rejected
                reject(result.canceled);
            }
        }).catch((e) => {
            // error
            outErrorMsg(e, 3);
            // rejected
            reject();
        });
    });
};
// show dialog
const showDialog = (title, message, detail, flg = false) => {
    try {
        // dialog options
        const options = {
            type: 'none',
            title: title,
            message: message,
            detail: detail.toString(),
        };
        // error or not
        if (flg) {
            options.type = 'error';
        }
        else {
            options.type = 'info';
        }
        // show dialog
        electron_1.dialog.showMessageBox(options);
    }
    catch (e) {
        // error
        outErrorMsg(e, 4);
    }
    ;
};
// outuput error
const outErrorMsg = (e, no) => {
    // if type is error
    if (e instanceof Error) {
        // error
        console.log(`${no}: ${e.message}`);
    }
};
//# sourceMappingURL=getCropsData.js.map