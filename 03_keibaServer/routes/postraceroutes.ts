/**
 * postraceroutes.ts
 *
 * route：racinginfo POST Routing
**/

'use strict';

// namespace
import { myConst } from '../consts/globalvariables';

// modules
import { Router } from 'express'; // express
import Logger from '../class/Logger'; // logger
// SQL
import { selectAsset } from '../modules/mysqlModule';
// logger setting
const logger = new Logger(myConst.APP_NAME);

// race posing
export const postRaceRouter = () => {
  // router
  const router = Router();

  // get race no
  router.post('/getracingno', async (req, res) => {
    try {
      logger.info('getracingno mode');
      // promises
      let promises: Promise<any>[] = [];
      // promises
      let raceNos: string[] = [];
      // racing date
      const reqraceDate: any = req.body.date ?? null;
      logger.trace(`getracingno: date: ${reqraceDate}`);

      // no data
      if (!reqraceDate) {
        throw new Error('reqraceDate: no necessary data');
      }
      // racing date
      const tmpRacingdate: string = String(reqraceDate);

      // if shorter then 4 char
      if (tmpRacingdate.length < 4) {
        throw new Error('reqraceDate: no date data');
      }
      // racing year
      const raceYear: string = tmpRacingdate.substring(0, 4);


      for (let db of myConst.DB_NAMES) {
        // select from DB
        promises.push(selectAsset(db, ['racingdate', 'usable'], [[tmpRacingdate], [1]], ['place_id', 'stages', 'days']));
      }
      // get from DB
      const raceNoArray: any = await Promise.all(promises);

      // modify them
      for (let race of raceNoArray) {
        // if not empty
        if (race.length > 0) {
          // placeID
          const placeid: string = String(race[0].place_id).padStart(2, '0');
          // stage
          const raceStage: string = String(race[0].stages).padStart(2, '0');
          // days
          const raceDays: string = String(race[0].days).padStart(2, '0');
          // return raceID
          raceNos.push(raceYear + placeid + raceStage + raceDays);
        }
      }

      logger.info(`racingno get completed.`);
      console.log(raceNos);
      // success
      res.status(200).send(raceNos);

    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  return router;
};
