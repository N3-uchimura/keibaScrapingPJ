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

  // get race id
  router.post('/getracingno', async (req, res) => {
    try {
      logger.info('getracingno mode');
      // racing date
      const reqraceDate: any = req.body.date ?? null;
      logger.trace(`getracingno: date: ${reqraceDate}`);

      // no data
      if (!reqraceDate) {
        throw new Error('reqraceDate: no necessary data');
      }
      // racing year
      const raceYear: string = String(reqraceDate).substring(0, 4);

      // get from DB
      const raceNoArray: any = await Promise.all(
        myConst.DB_NAMES.map(async (table: string): Promise<string> => {
          return new Promise(async (resolve, reject) => {
            // select from DB
            const selectedRace: any = await selectAsset(table, ['racingdate', 'usable'], [[reqraceDate], [1]], ['place_id', 'stages', 'days']);

            // if not empty
            if (selectedRace.length > 0) {
              // placeID
              const placeid: string = String(selectedRace[0].place_id).padStart(2, '0');
              // stage
              const raceStage: string = String(selectedRace[0].stages).padStart(2, '0');
              // days
              const raceDays: string = String(selectedRace[0].days).padStart(2, '0');
              // return raceID
              resolve(raceYear + placeid + raceStage + raceDays);
            }
          })
        }));

      logger.info(`racingno get completed.`);
      // success
      res.status(200).send(raceNoArray);

    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  return router;
};
