/**
 * electronCsv.ts
 *
 * name：CSV
 * function：CSV operation for electron
 * updated: 2024/11/11
 **/

// define modules
import { dialog } from 'electron'; // electron
import { promises } from "fs"; // file system
import parse from 'csv-parse/lib/sync'; // csv parser
import stringifySync from 'csv-stringify/lib/sync'; // csv 
import iconv from 'iconv-lite'; // encoding
import { FileFilter } from 'electron/main'; // file filter

// file system definition
const { readFile, writeFile } = promises;

// csv dialog option
interface csvDialog {
  properties: any; // file open
  title: string; // header title
  defaultPath: string; // default path
  filters: FileFilter[]; // filter
}

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
  getCsvData = async (filenames: string): Promise<any> => {
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
  makeCsvData = async (arr: any[], columns: { [key: string]: any }, filename: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('func: makeCsvData mode');
        // csvdata
        const csvData: any = stringifySync(arr, { header: true, columns: columns });
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

  // showCSVDialog
  showCSVDialog = async (mainWindow: any): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // options
        const dialogOptions: csvDialog = {
          properties: ['openFile'], // file open
          title: 'choose csv file', // header title
          defaultPath: '.', // default path
          filters: [
            { name: 'csv(Shif-JIS)', extensions: ['csv'] } // filter
          ],
        }
        // show file dialog
        dialog.showOpenDialog(mainWindow, dialogOptions).then((result: any) => {

          // file exists
          if (result.filePaths.length > 0) {
            // resolved
            resolve(result.filePaths);

            // no file
          } else {
            // rejected
            reject(result.canceled);
          }

        }).catch((e: unknown) => {
          // error
          console.log(e);
          // rejected
          reject('error');
        });

      } catch (e: unknown) {
        // error
        console.log(e);
        // error type
        if (e instanceof Error) {
          reject('error');
        }
      }
    });
  }
}

// export module
export default CSV;