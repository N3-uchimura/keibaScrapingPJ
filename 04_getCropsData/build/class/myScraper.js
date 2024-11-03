/**
 * myScraper.ts
 *
 * class：Scrape
 * function：scraping site
 **/
'use strict';
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
exports.Scrape = void 0;
// constants 
const USER_ROOT_PATH = process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'] ?? ''; // user path
const CHROME_EXEC_PATH1 = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'; // chrome.exe path1
const CHROME_EXEC_PATH2 = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // chrome.exe path2
const CHROME_EXEC_PATH3 = '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'; // chrome.exe path3
const DISABLE_EXTENSIONS = '--disable-extensions'; // disable extension
const ALLOW_INSECURE = '--allow-running-insecure-content'; // allow insecure content
const IGNORE_CERT_ERROR = '--ignore-certificate-errors'; // ignore cert-errors
const NO_SANDBOX = '--no-sandbox'; // no sandbox
const DISABLE_SANDBOX = '--disable-setuid-sandbox'; // no setup sandbox
const DISABLE_DEV_SHM = '--disable-dev-shm-usage'; // no dev shm
const DISABLE_GPU = '--disable-gpu'; // no gpu
const NO_FIRST_RUN = '--no-first-run'; // no first run
const NO_ZYGOTE = '--no-zygote'; // no zygote
const DEF_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'; // useragent
const WAIT_TIME = 3000;
// define modules
const puppeteer_core_1 = __importDefault(require("puppeteer-core")); // Puppeteer for scraping
const path_1 = __importDefault(require("path")); // path
const fs = __importStar(require("fs")); // fs
// class
class Scrape {
    // constractor
    constructor() {
    }
    // initialize
    init() {
        return new Promise(async (resolve, reject) => {
            try {
                const puppOptions = {
                    headless: true,
                    executablePath: getChromePath(),
                    ignoreDefaultArgs: [],
                    args: [], // args
                };
                // lauch browser
                Scrape.browser = await puppeteer_core_1.default.launch(puppOptions);
                // create new page
                Scrape.page = await Scrape.browser.newPage();
                // mimic agent
                await Scrape.page.setUserAgent(DEF_USER_AGENT);
                // resolved
                resolve();
            }
            catch (e) {
                // error
                outErrorMsg(e, 1);
                // reject
                reject();
            }
        });
    }
    // go page
    doGo(targetPage) {
        return new Promise(async (resolve, reject) => {
            try {
                // goto target page
                await Scrape.page.goto(targetPage, {
                    waitUntil: 'networkidle2',
                });
                // resolved
                resolve();
            }
            catch (e) {
                // error
                outErrorMsg(e, 2);
                // reject
                reject();
            }
        });
    }
    // click
    doClick(elem) {
        return new Promise(async (resolve, reject) => {
            try {
                // wait for loading selector
                await Scrape.page.waitForSelector(elem, { timeout: WAIT_TIME });
                // click target element
                await Scrape.page.click(elem);
                // resolved
                resolve();
            }
            catch (e) {
                // error
                outErrorMsg(e, 3);
                // reject
                reject();
            }
        });
    }
    getUrl() {
        return new Promise(async (resolve, reject) => {
            try {
                // click target element
                const url = await Scrape.page.url();
                // resolved
                resolve(url);
            }
            catch (e) {
                // error
                outErrorMsg(e, 3);
                // reject
                reject();
            }
        });
    }
    // type
    doType(elem, value) {
        return new Promise(async (resolve, reject) => {
            try {
                // wait for loading selector
                await Scrape.page.waitForSelector(elem, { timeout: WAIT_TIME });
                // type element on specified value
                await Scrape.page.type(elem, value);
                // resolved
                resolve();
            }
            catch (e) {
                // error
                outErrorMsg(e, 4);
                // reject
                reject();
            }
        });
    }
    // select
    doSelect(elem) {
        return new Promise(async (resolve, reject) => {
            try {
                // wait for loading selector
                await Scrape.page.waitForSelector(elem, { timeout: WAIT_TIME });
                // select element
                await Scrape.page.select(elem);
                // resolved
                resolve();
            }
            catch (e) {
                // error
                outErrorMsg(e, 5);
                // reject
                reject();
            }
        });
    }
    // screenshot
    doScreenshot(path) {
        return new Promise(async (resolve, reject) => {
            try {
                // take screenshot
                await Scrape.page.screenshot({ path: path });
                // resolved
                resolve();
            }
            catch (e) {
                // error
                outErrorMsg(e, 6);
                // reject
                reject();
            }
        });
    }
    // eval
    doSingleEval(selector, property) {
        return new Promise(async (resolve, reject) => {
            try {
                // wait for loading selector
                await Scrape.page.waitForSelector(selector, { timeout: WAIT_TIME });
                // target item
                const item = await Scrape.page.$(selector);
                // if not null
                if (item !== null) {
                    // got data
                    const data = await (await item.getProperty(property)).jsonValue();
                    // if got data not null
                    if (data !== null) {
                        // resolved
                        resolve(data);
                    }
                }
            }
            catch (e) {
                // error
                outErrorMsg(e, 7);
                // reject
                reject();
            }
        });
    }
    // eval
    doMultiEval(selector, property) {
        return new Promise(async (resolve, reject) => {
            try {
                // data set
                let datas = [];
                // wait for loading selector
                await Scrape.page.waitForSelector(selector, { timeout: WAIT_TIME });
                // target list
                const list = await Scrape.page.$$(selector);
                // loop in list
                for (const ls of list) {
                    // push to data set
                    datas.push(await (await ls.getProperty(property)).jsonValue());
                }
                // resolved
                resolve(datas);
            }
            catch (e) {
                // error
                outErrorMsg(e, 8);
                // reject
                reject();
            }
        });
    }
    // waitfor
    doWaitFor(time) {
        return new Promise(async (resolve, reject) => {
            try {
                // waitfor specified time
                await Scrape.page.waitForTimeout(time);
                // resolved
                resolve();
            }
            catch (e) {
                // error
                outErrorMsg(e, 9);
                // reject
                reject();
            }
        });
    }
    // waitSelector
    doWaitSelector(elem, time) {
        return new Promise(async (resolve, reject) => {
            try {
                // wait for loading selector
                await Scrape.page.waitForSelector(elem, { timeout: time });
                // resolved
                resolve();
            }
            catch (e) {
                // error
                outErrorMsg(e, 10);
                // reject
                reject();
            }
        });
    }
    // waitNav
    doWaitNav() {
        return new Promise(async (resolve, reject) => {
            try {
                // wait for naviation
                await Scrape.page.waitForNavigation({ waitUntil: 'networkidle2' });
                // resolved
                resolve();
            }
            catch (e) {
                // error
                outErrorMsg(e, 11);
                // reject
                reject();
            }
        });
    }
    // exit
    doClose() {
        return new Promise(async (resolve, reject) => {
            try {
                // close browser
                await Scrape.browser.close();
                // resolved
                resolve();
            }
            catch (e) {
                // error
                outErrorMsg(e, 12);
                // reject
                reject();
            }
        });
    }
    // page exist
    detectPage(element) {
        return new Promise(async (resolve, reject) => {
            try {
                // detect page
                const isSucceeded = await Scrape.page.$(element).then(res => !!res);
                // resolved
                resolve(isSucceeded);
            }
            catch (e) {
                // error
                outErrorMsg(e, 12);
                // reject
                reject();
            }
        });
    }
}
exports.Scrape = Scrape;
// get chrome absolute path
const getChromePath = () => {
    // chrome tmp path
    const tmpPath = path_1.default.join(USER_ROOT_PATH, CHROME_EXEC_PATH3);
    // 32bit
    if (fs.existsSync(CHROME_EXEC_PATH1)) {
        return CHROME_EXEC_PATH1 ?? '';
        // 64bit
    }
    else if (fs.existsSync(CHROME_EXEC_PATH2)) {
        return CHROME_EXEC_PATH2 ?? '';
        // user path
    }
    else if (fs.existsSync(tmpPath)) {
        return tmpPath ?? '';
        // error
    }
    else {
        // error logging
        console.log('no chrome path error');
        // return blank
        return '';
    }
};
// outuput error
const outErrorMsg = (e, no) => {
    // if type is error
    if (e instanceof Error) {
        // error
        console.log(`${no}: ${e.message}`);
    }
};
//# sourceMappingURL=myScraper.js.map