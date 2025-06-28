/**
 * horseroutes.ts
 *
 * route：horseinfo Routing
**/

'use strict';

/// Constants
// namespace
import { myConst } from '../consts/globalvariables';

/// Modules
import { Router } from 'express'; // express
import Logger from '../class/Logger'; // logger
// SQL
import { selectAsset } from '../modules/mysqlModule';
// logger setting
const logger = new Logger(myConst.APP_NAME);

/// Router
// horse posing
export const horseRouter = () => {
  // router
  const router = Router();

  // get stallion
  router.post('/getstallion', async (req, res) => {
    try {
      logger.info('getstallion mode');
      // select 
      const allStallions = await selectAsset('stallion', ['usable'], [[1]], ['horsename', 'url']);
      logger.info(`racingno get completed.`);
      // success
      res.status(200).send(allStallions);

    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  return router;
};
