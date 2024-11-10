/**
 * getTraining.ts
 *
 * function：get Netkeiba Training Data
 **/

'use strict';

// constants
const DEF_NETKEIBA_URL: string = 'https://netkeiba.com'; // base url
const DEF_TRAINING_URL: string = 'https://race.netkeiba.com/race/oikiri.html?race_id='; // training page url
const DEF_URL_QUERY: string = '&type=2&rf=shutuba_submenu'; // query
const OUTPUT_PATH: string = './output/'; // output path

// import modules
import * as dotenv from 'dotenv'; // dotenc
dotenv.config(); // dotenv
import { Scrape } from './class/Scrape1103'; // scraper
import CSV from './class/Csv1104'; // csv

// csv
const csvMaker = new CSV('SJIS');

// active course ID
const activeId: string = '202403030410';
// racing course
const activeCourseName: string = '福島';

// netkeiba id
const netKeibaId: string = process.env.NETKEIBA_ID ?? '';
// netkeiba pass
const netKeibaPass: string = process.env.NETKEIBA_PASS ?? '';

// scraper instance
const scraper = new Scrape();

// main
(async (): Promise<void> => {
  try {
    // last array
    let wholeArray: any = [];
    // course
    const targetCourse: string = activeId.slice(0, -2);
    // base url
    const baseUrl: string = `${DEF_TRAINING_URL}${targetCourse}`;

    // initialize
    await scraper.init();
    // goto netkeiba
    await scraper.doGo(DEF_NETKEIBA_URL);
    // wait for loading of login button
    await scraper.doWaitFor(2000);
    // click login
    await scraper.doClick('.Icon_Login');
    // wait for id/pass input
    await scraper.doWaitFor(3000);
    // input id
    await scraper.doType('input[name="login_id"]', netKeibaId);
    // input pass
    await scraper.doType('input[name="pswd"]', netKeibaPass);
    // wait 3 sec
    await scraper.doWaitFor(3000);
    // click login button
    await scraper.doClick('.loginBtn__wrap input');
    // wait 3 sec
    await scraper.doWaitFor(3000);
    // for race loop
    const racenums: number[] = [...Array(12)].map((_, i) => i + 1);
    // filename
    const fileName: string = (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 8);
    // csv filename
    const filePath: string = `${OUTPUT_PATH}${fileName}_${activeCourseName}.csv`;

    // loop each races
    for await (let j of racenums) {
      try {
        // last array
        let finalArray: any = [];
        // race
        const raceName: string = `${activeCourseName}${j}R`;
        // url
        const targetUrl: string = `${baseUrl}${String(j).padStart(2, '0')}${DEF_URL_QUERY}`;
        // goto site
        await scraper.doGo(targetUrl);
        // wait for datalist
        await scraper.doWaitFor(3000);
        // for loop
        const horsenums: number[] = [...Array(18)].map((_, i) => i + 1);
        // loop each horses
        for await (let i of horsenums) {
          try {
            await scraper.doWaitFor(1000);
            // no element break
            if (!await scraper.doCheckSelector(`.OikiriDataHead${i} .Horse_Info .Horse_Name a`)) {
              break;
            }
            const postArray: any = await Promise.all([
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
            // set to array
            finalArray.push(postArray);
            // wait 0.5 sec
            await scraper.doWaitFor(500);

          } catch (e) {
            console.log(e);
            break;
          }
        }
        // put into wholearray
        wholeArray.push(finalArray);
        // wait 0.5 sec
        await scraper.doWaitFor(500);

        console.log(`${raceName} finished`);

      } catch (err2: unknown) {
        // error
        console.log(err2);
      }
    }
    // header
    let columns: { [key: string]: string } = {
      horse: '馬名', // horse name
      date: '実施日', // date
      place: '競馬場', // training center
      condition: '馬場状態', // field condition
      strength: '強さ', // training strength
      review: 'レビュー', // review comment
      time1: 'ラップ1', // rap time
      time2: 'ラップ2', // rap time
      time3: 'ラップ3', // rap time
      time4: 'ラップ4', // rap time
      time5: 'ラップ5', // rap time
      color1: '色1', // training color
      color2: '色2', // training color
      color3: '色3', // training color
      color4: '色4', // training color
      color5: '色5', // training color
    };
    // finaljson
    let finalJsonArray: any[] = [];
    // all races
    wholeArray.forEach((races: any) => {
      // for training
      races.forEach((data: any) => {
        // empty array
        let tmpObj: { [key: string]: string } = {
          horse: '', // horse name
          date: '', // date
          place: '', // training center
          condition: '', // field condition
          strength: '', // training strength
          review: '', // review comment
          time1: '', // rap time
          time2: '', // rap time
          time3: '', // rap time
          time4: '', // rap time
          time5: '', // rap time
          color1: '', // training color
          color2: '', // training color
          color3: '', // training color
          color4: '', // training color
          color5: '', // training color
        };
        // set each value
        tmpObj.horse = data[0];
        tmpObj.date = data[1];
        tmpObj.place = data[2];
        tmpObj.condition = data[3];
        tmpObj.strength = data[4];
        tmpObj.review = data[5];
        tmpObj.time1 = data[6][0];
        tmpObj.time2 = data[6][1];
        tmpObj.time3 = data[6][2];
        tmpObj.time4 = data[6][3];
        tmpObj.time5 = data[6][4];
        tmpObj.color1 = data[7][0];
        tmpObj.color2 = data[7][1];
        tmpObj.color3 = data[7][2];
        tmpObj.color4 = data[7][3];
        tmpObj.color5 = data[7][4];
        // set to json
        finalJsonArray.push(tmpObj);
      });
    });
    // write data
    await csvMaker.makeCsvData(finalJsonArray, columns, filePath);
    // close browser
    await scraper.doClose();

    // finished
    console.log(`all finished`);

  } catch (e: unknown) {
    // error
    console.log(e);
  }
})();

