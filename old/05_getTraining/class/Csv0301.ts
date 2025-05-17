/**
 * Csv.ts
 *
 * name：CSV
 * function：CSV operation for electron
 * updated: 2025/03/01
 **/

'use strict';

// define modules
import { promises } from 'fs'; // file system
import iconv from 'iconv-lite'; // encoding
import { parse } from 'csv-parse/sync'; // csv parser
import { stringify } from 'csv-stringify/sync'; // csv stringify
import Logger from './Logger'; // logger

// file system definition
const { readFile, writeFile } = promises;

// CSV class
class CSV {
  static logger: any; // static logger
  static defaultencoding: string; // defaultencoding

  // construnctor
  constructor(encoding: string) {
    // loggeer instance
    CSV.logger = new Logger('csv', true);
    CSV.logger.debug('csv: constructed');
    // DB config
    CSV.defaultencoding = encoding;
  }

  // getCsvData
  getCsvData = async (filenames: string[]): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        CSV.logger.debug('csv: getCsvData started.');
        // filename exists
        if (filenames.length) {
          // read file
          const data: any = await readFile(filenames[0]);
          // encoding
          const str: string = iconv.decode(data, CSV.defaultencoding);
          // csv parse
          const tmpRecords: string[][] = parse(str, {
            columns: false, // no column
            from_line: 2, // ignore first line
            skip_empty_lines: true, // ignore empty cell
          });
          CSV.logger.debug(`you got csv named ${data}`);
          // resolve
          resolve({
            record: tmpRecords, // dataa
            filename: filenames[0], // filename
          });

        } else {
          throw Error('csv: no file exists.');
        }

      } catch (e: unknown) {
        CSV.logger.error(e);
        reject();
      }
    });
  }

  // makeCsvData
  makeCsvData = async (arr: any[], columns: { [key: string]: string }, filename: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        CSV.logger.debug('csv: makeCsvData started.');
        // csvdata
        const csvData: any = stringify(arr, { header: true, columns: columns });
        // write to csv file
        await writeFile(filename, iconv.encode(csvData, 'shift_jis'));
        CSV.logger.debug('csv: makeCsvData finished.');
        // complete
        resolve();

      } catch (e: unknown) {
        CSV.logger.error(e);
        reject();
      }
    });
  }
}

// export module
export default CSV;