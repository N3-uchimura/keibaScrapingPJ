/**
 * ElLogger.ts
 *
 * name：ElLogger
 * function：Logging operation for electron
 * updated: 2025/03/01
 **/

"use strict";

//* Constants
const MAKER_NAME: string = 'nthree'; // maker name

// define modules
import * as path from "path"; // path
import { app } from 'electron'; // electron
import logger from "electron-log"; // Logger

// Logger class
class ELLogger {
  // construnctor
  constructor(appname: string, logname: string) {
    // log dir path
    const dirpath: string = path.join(app.getPath("home"), MAKER_NAME, appname);
    // Logger config
    const prefix: string = getNowDate(0);
    // filename tmp
    logger.transports.file.fileName = `${logname}.log`;
    // filename tmp
    logger.transports.console.format =
      "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
    // set production
    logger.transports.console.level = "info";
    // set production
    logger.transports.file.level = "info";
    // filename now
    const curr: string = logger.transports.file.fileName;
    // file saving path
    logger.transports.file.resolvePathFn = () => `${dirpath}/${logname}/${prefix}_${curr}`;
  }

  // debug
  debug = (message: string) => {
    logger.debug(message);
  };

  // inquire
  info = (message: string) => {
    logger.info(message);
  };

  // empty or not
  error = (e: unknown) => {
    if (e instanceof Error) {
      // error
      logger.error(process.pid, e.message);
    }
  };
}

// get now date
const getNowDate = (diff: number): string => {
  // now
  const d: Date = new Date();
  // combine date string
  const prefix: string =
    d.getFullYear() +
    ("00" + (d.getMonth() + 1)).slice(-2) +
    ("00" + (d.getDate() + diff)).slice(-2);
  return prefix;
};

// export module
export default ELLogger;
