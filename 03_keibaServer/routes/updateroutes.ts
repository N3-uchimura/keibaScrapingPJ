/**
 * updateroutes.ts
 *
 * update Routing
**/

'use strict';

/// Constants
// namespace
import { myConst } from '../consts/globalvariables';

/// Modules
import * as path from 'node:path'; // path
import { config as dotenv } from 'dotenv'; // dotenv
import { Router } from 'express'; // express
import Logger from '../class/Logger'; // logger
// logger setting
const logger = new Logger(myConst.APP_NAME);
// dotenv
dotenv({ path: path.join(__dirname, '.env') });

/// Router
// update posing
export const updateRouter = () => {
  // router
  const router = Router();

  // get race no
  router.post('/release', async (req, res) => {
    try {
      logger.info('getracingno mode');
      res.send();

    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  return router;
};
