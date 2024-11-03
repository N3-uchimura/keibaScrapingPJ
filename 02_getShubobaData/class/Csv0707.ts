/**
 * Csv.ts
 *
 * name：CSV
 * function：CSV operation for electron
 * updated: 2024/07/07
 **/

// define modules
import { parse } from 'csv-parse/sync'; // csv parser
import { promises } from "fs"; // file system
import iconv from 'iconv-lite'; // encoding
import { stringify } from 'csv-stringify/sync'; // csv stringify

// file system definition
const { readFile, writeFile } = promises;

// CSV class
class CSV {
  static defaultencoding: string; // defaultencoding

  // construnctor
  constructor(encoding: string) {
    console.log('csv: initialize mode');
    // DB config
    CSV.defaultencoding = encoding;
  }

  // getCsvData
  getCsvData = async (filenames: string[]): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
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
          console.log(`you got csv named ${data}`);
          // resolve
          resolve({
            record: tmpRecords, // dataa
            filename: filenames[0], // filename
          });


        } else {
          // nofile, exit
          reject();
        }

      } catch (e: unknown) {
        // error
        console.log(e);
        // error type
        if (e instanceof Error) {
          reject();
        }
      }
    });
  }

  // makeCsvData
  makeCsvData = async (arr: any[], filename: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('func: makeCsvData mode');
        // csvdata
        const csvData: any = stringify(arr, { header: true });
        // write to csv file
        await writeFile(filename, iconv.encode(csvData, 'shift_jis'));
        // complete
        resolve();

      } catch (e: unknown) {
        // error
        console.log(e);
        // error type
        if (e instanceof Error) {
          reject();
        }
      }
    });
  }
}

// export module
export default CSV;