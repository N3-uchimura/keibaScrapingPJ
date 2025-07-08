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

  // update
  router.get('/release/:platform/:arch', async (req, res) => {
    try {
      logger.info('update mode');
      // platform
      const platform: string = req.params.platform;
      // architecture
      const arch: string = req.params.arch;
      // version
      const version: string = myConst.APP_VERSION;
      // filename
      const updatefilename: string = `${myConst.UPDATE_APP_NAME} Setup ${version}.exe`;
      // file path
      const updatePath: string = `../update/${platform}/${arch}/${updatefilename}`;
      // download
      res.download(updatePath);

    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  return router;
};
