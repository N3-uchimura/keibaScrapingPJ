"use strict";
/**
 * Scrape.ts
 *
 * class：Scrape
 * function：scraping site
 * updated: 2024/03/26
 **/
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
const USER_ROOT_PATH = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"] ?? ''; // user path
const CHROME_EXEC_PATH1 = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'; // chrome.exe path1
const CHROME_EXEC_PATH2 = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // chrome.exe path2
const CHROME_EXEC_PATH3 = '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'; // chrome.exe path3
const DISABLE_EXTENSIONS = "--disable-extensions"; // disable extension
const ALLOW_INSECURE = "--allow-running-insecure-content"; // allow insecure content
const IGNORE_CERT_ERROR = "--ignore-certificate-errors"; // ignore cert-errors
const NO_SANDBOX = "--no-sandbox"; // no sandbox
const DISABLE_SANDBOX = "--disable-setuid-sandbox"; // no setup sandbox
const DISABLE_DEV_SHM = "--disable-dev-shm-usage"; // no dev shm
const DISABLE_GPU = "--disable-gpu"; // no gpu
const NO_FIRST_RUN = "--no-first-run"; // no first run
const NO_ZYGOTE = "--no-zygote"; // no zygote
const MAX_SCREENSIZE = "--start-maximized"; // max screen
const DEF_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"; // useragent
// define modules
const fs = __importStar(require("fs")); // fs
const path = __importStar(require("path")); // path
const promises_1 = require("node:timers/promises"); // wait for seconds
const puppeteer_core_1 = __importDefault(require("puppeteer-core")); // Puppeteer for scraping
// class
class Scrape {
    // constractor
    constructor() {
        // result
        this._result = false;
        // height
        this._height = 0;
    }
    // initialize
    init() {
        return new Promise(async (resolve, reject) => {
            try {
                const puppOptions = {
                    headless: true,
                    executablePath: getChromePath(),
                    ignoreDefaultArgs: [DISABLE_EXTENSIONS],
                    args: [
                        NO_SANDBOX,
                        DISABLE_SANDBOX,
                        DISABLE_DEV_SHM,
                        DISABLE_GPU,
                        NO_FIRST_RUN,
                        NO_ZYGOTE,
                        ALLOW_INSECURE,
                        IGNORE_CERT_ERROR,
                        MAX_SCREENSIZE,
                    ], // args
                };
                // lauch browser
                Scrape.browser = await puppeteer_core_1.default.launch(puppOptions);
                // create new page
                Scrape.page = await Scrape.browser.newPage();
                // set viewport
                Scrape.page.setViewport({
                    width: 1920,
                    height: 1000,
                });
                // mimic agent
                await Scrape.page.setUserAgent(DEF_USER_AGENT);
                // resolved
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`1: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // get page title
    getTitle() {
        return new Promise(async (resolve, reject) => {
            try {
                // resolved
                resolve(await Scrape.page.title);
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`2: ${e.message}`);
                    // reject
                    reject(e.message);
                }
            }
        });
    }
    // press enter
    pressEnter() {
        return new Promise(async (resolve, reject) => {
            try {
                // press enter key
                await Scrape.page.keyboard.press("Enter");
                // resolved
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`3: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // go page
    doGo(targetPage) {
        return new Promise(async (resolve, reject) => {
            try {
                // goto target page
                await Scrape.page.goto(targetPage);
                // get page height
                const height = await Scrape.page.evaluate(() => {
                    return document.body.scrollHeight;
                });
                // body height
                this._height = height;
                // resolved
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`4: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // click
    doClick(elem) {
        return new Promise(async (resolve, reject) => {
            try {
                // click target element
                await Scrape.page.$$eval(elem, (elements) => elements[0].click());
                // resolved
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`5: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // type
    doType(elem, value) {
        return new Promise(async (resolve, reject) => {
            try {
                // type element on specified value
                await Scrape.page.type(elem, value, { delay: 100 });
                // resolved
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`6: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // clear
    doClear(elem) {
        return new Promise(async (resolve, reject) => {
            try {
                // clear the textbox
                await Scrape.page.$eval(elem, (element) => (element.value = ""));
                // resolved
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`7: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // select
    doSelect(elem) {
        return new Promise(async (resolve, reject) => {
            try {
                // select dropdown element
                await Scrape.page.select(elem);
                // resolved
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`8: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // screenshot
    doScreenshot(path) {
        return new Promise(async (resolve, reject) => {
            try {
                // take screenshot of window
                await Scrape.page.screenshot({ path: path });
                // resolved
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`9: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // mouse wheel
    mouseWheel() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(this._height);
                // mouse wheel to bottom
                await Scrape.page.mouse.wheel({ deltaY: this._height - 200 });
                // resolved
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`10: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // eval
    doSingleEval(selector, property) {
        return new Promise(async (resolve, reject) => {
            try {
                // target item
                const exists = await Scrape.page.$eval(selector, () => true).catch(() => false);
                // no result
                if (!exists) {
                    console.log("error");
                    reject("error");
                }
                else {
                    // target value
                    const item = await Scrape.page.$(selector);
                    // if not null
                    if (item !== null) {
                        // got data
                        const data = await (await item.getProperty(property)).jsonValue();
                        // if got data not null
                        if (data) {
                            // resolved
                            resolve(data);
                        }
                        else {
                            reject("error");
                        }
                    }
                    else {
                        reject("error");
                    }
                }
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`11: ${e.message}`);
                    // reject
                    reject(e.message);
                }
            }
        });
    }
    // eval
    doMultiEval(selector, property) {
        return new Promise(async (resolve, reject) => {
            try {
                // data set
                let datas = [];
                // target list
                const list = await Scrape.page.$$(selector);
                // result
                const result = await Scrape.page.$(selector).then((res) => !!res);
                // if element exists
                if (result) {
                    // loop in list
                    for (const ls of list) {
                        // push to data set
                        datas.push(await (await ls.getProperty(property)).jsonValue());
                    }
                    // resolved
                    resolve(datas);
                }
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`12: ${e.message}`);
                    // reject
                    reject(e.message);
                }
            }
        });
    }
    // waitSelector
    doWaitFor(time) {
        return new Promise(async (resolve, reject) => {
            try {
                // wait for time
                await (0, promises_1.setTimeout)(time);
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`13: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // waitSelector
    doWaitSelector(elem, time) {
        return new Promise(async (resolve, reject) => {
            try {
                // target item
                const exists = await Scrape.page.$eval(elem, () => true).catch(() => false);
                // if element exists
                if (exists) {
                    // wait for loading selector
                    await Scrape.page.waitForSelector(elem, { timeout: time });
                    // resolved
                    resolve();
                }
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`14: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // wait for navigaion
    doWaitForNav(time) {
        return new Promise(async (resolve, reject) => {
            try {
                // wait for time
                await Scrape.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: time });
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`15: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // check Selector
    doCheckSelector(elem) {
        return new Promise(async (resolve, reject) => {
            try {
                // target item
                const exists = await Scrape.page.$eval(elem, () => true).catch(() => false);
                // return true/false
                resolve(exists);
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`16: ${e.message}`);
                    // reject
                    reject(false);
                }
            }
        });
    }
    // close window
    doClose() {
        return new Promise(async (resolve, reject) => {
            try {
                // close browser
                await Scrape.browser.close();
                // resolved
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`17: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // reload
    doReload() {
        return new Promise(async (resolve, reject) => {
            try {
                // close browser
                await Scrape.page.reload();
                // resolved
                resolve();
            }
            catch (e) {
                // if type is error
                if (e instanceof Error) {
                    // error
                    console.log(`18: ${e.message}`);
                    // reject
                    reject();
                }
            }
        });
    }
    // set result
    set setSucceed(selector) {
        // Do something with val that takes time
        this._result = Scrape.page.$(selector).then((res) => !!res);
    }
    // get result
    get getSucceed() {
        return this._result;
    }
}
exports.Scrape = Scrape;
// get chrome absolute path
const getChromePath = () => {
    // chrome tmp path
    const tmpPath = path.join(USER_ROOT_PATH, CHROME_EXEC_PATH3);
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
        console.log('16: no chrome path error');
        return '';
    }
};
//# sourceMappingURL=Scrape0326.js.map