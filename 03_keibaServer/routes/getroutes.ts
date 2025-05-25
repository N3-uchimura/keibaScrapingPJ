/**
 * getroutes.ts
 *
 * route：GET Routing
**/

'use strict';

// namespace
import { myConst } from '../consts/globalvariables';

// modules
import { Router } from 'express';
import Logger from '../class/Logger'; // logger
// logger
const logger: Logger = new Logger(myConst.APP_NAME);

// GET Router
export const getRouter = () => {
  // router
  const router = Router();

  // get test
  router.get('/test', async (_, res) => {
    try {
      logger.info('test connected');

    } catch (e: unknown) {
      // error
      logger.error(e);
    }
  });

  return router;
};