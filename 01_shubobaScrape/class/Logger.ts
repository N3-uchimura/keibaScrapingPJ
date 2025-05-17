/**
 * Logger.ts
 *
 * name：Logger
 * function：Logging operation
 * updated: 2025/05/17
 **/

'use strict';

// namespace
import { myConst } from '../consts/globalvariables'; // namespace

// define modules
import * as path from 'node:path'; // path
import * as log4js from 'log4js'; // Logger
import { config as dotenv } from 'dotenv'; // dotenv
dotenv({ path: path.join(__dirname, '.env') }); // env
// re define
const LOG_LEVEL: string = process.env.LOG_LEVEL ?? 'all';

// Logger class
class Logger {
  // logger
  static logger: any;
  // logger
  static mkdirManager: any;
  // logger dir path
  static loggerDir: string;

  // construnctor
  constructor(dirname: string, flg: boolean) {
    // log4js options
    let log4jsOptions: any;

    // log mode
    if (flg) {
      // home directory path
      const homeDir: string = process.env[
        process.platform == 'win32' ? 'USERPROFILE' : 'HOME'
      ]!;
      // logger dir path
      Logger.loggerDir = path.join(homeDir, myConst.COMPANY_NAME, dirname);
      // Logger config
      const prefix: string = `${dirname}-${new Date().toJSON().slice(0, 10)}`;
      // set log4js options
      log4jsOptions = {
        appenders: {
          app: {
            type: 'dateFile',
            filename: path.join(Logger.loggerDir, `${prefix}.log`)
          },
          out: { type: 'stdout' }
        },
        categories: {
          default: { appenders: ['out', 'app'], level: LOG_LEVEL }
        }
      };
    } else {
      // set log4js options
      log4jsOptions = {
        appenders: {
          out: { type: 'stdout', level: LOG_LEVEL }
        },
        categories: {
          default: { appenders: ['out'], level: LOG_LEVEL }
        }
      };
    }
    // logger config
    log4js.configure(log4jsOptions);
    // logger instance
    Logger.logger = log4js.getLogger(); // logger instance
    Logger.logger.level = LOG_LEVEL;
  }

  // log info
  info = (message: string) => {
    Logger.logger.info(message);
  };

  // log debug info
  debug = (message: string) => {
    Logger.logger.debug(message);
  };

  // log trace info
  trace = (message: string) => {
    Logger.logger.trace(message);
  };

  // log fatal info
  fatal = (message: string) => {
    Logger.logger.fatal(message);
  };

  // log error
  error = (e: unknown) => {
    // error
    if (e instanceof Error) {
      // error
      Logger.logger.error(e.message);
    }
  };

  // shutdown logger
  exit = () => {
    log4js.shutdown((err: unknown) => {
      if (err) throw err;
      process.exit(0);
    });
  };
}

// export module
export default Logger;
