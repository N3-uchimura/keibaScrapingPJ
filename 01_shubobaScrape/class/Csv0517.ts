/**
 * Csv.ts
 *
 * name：CSV
 * function：CSV operation for electron
 * updated: 2025/05/17
 **/

'use strict';

// define modules
import iconv from 'iconv-lite'; // encoding
import { readFile, writeFile } from 'node:fs/promises'; // file system
import { parse } from 'csv-parse/sync'; // csv parser
import { stringify } from 'csv-stringify/sync'; // csv stringify

// CSV class
class CSV {
  static logger: any; // static logger
  static defaultencoding: string; // defaultencoding

  // construnctor
  constructor(encoding: string, logger: any) {
    // loggeer instance
    CSV.logger = logger;
    // DB config
    CSV.defaultencoding = encoding;
    CSV.logger.debug('csv: constructed');
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
  makeCsvData = async (arr: any[], columns: string[], filename: string): Promise<void> => {
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