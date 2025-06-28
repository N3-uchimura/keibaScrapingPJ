/**
 * authroutes.ts
 *
 * route：secret Routing
**/

'use strict';

/// Constants
// namespace
import { myConst } from '../consts/globalvariables';

/// Modules
import * as path from 'path'; // path
import { Router } from 'express'; // express
import { config as dotenv } from 'dotenv'; // dotenv
import Crypto from '../class/Crypto0616'; // crypto
import Logger from '../class/Logger'; // logger
// dotenv
dotenv({ path: path.join(__dirname, '.env') });
// SQL
import { selectAsset } from '../modules/mysqlModule';
// logger setting
const logger = new Logger(myConst.APP_NAME);
// crypto
const cryptoMaker: Crypto = new Crypto(logger, process.env.CRYPTO_KEY!);

/// Router
// auth router
export const authRouter = () => {
  // router
  const router = Router();

  // authorize
  router.post('/authorize', async (req, res) => {
    try {
      logger.info('authorize mode');
      // token
      const reqToken: any = req.body.token ?? null;
      // key
      const reqKey: any = req.body.key ?? null;
      // secret word
      const reqWord: any = req.body.word ?? null;
      // no token/key
      if (!reqToken || !reqKey || !reqWord) {
        // error
        throw new Error('getsecretkey: no necessary data');
      }
      if (reqKey == process.env.ACCESS_KEY && reqWord == process.env.SECRET_WORD) {
        // DB読込
        const selectedAuthData: any = await selectAsset('user', ['productkey', 'usable'], [reqToken, [1]]);
        // ecnrypt


        logger.info(`authorize: completed.`);
        // success
        res.status(200).send({
          key: '',
        });
      }


    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  // authkey
  router.post('/authkey', async (req, res) => {
    try {
      logger.info('authkey mode');
      // token
      const reqToken: any = req.body.token ?? null;
      // key
      const reqKey: any = req.body.key ?? null;
      // secret word
      const reqWord: any = req.body.word ?? null;
      // no token/key
      if (!reqToken || !reqKey || !reqWord) {
        // error
        throw new Error('authkey: no necessary data');
      }
      if (reqKey == process.env.ACCESS_KEY && reqWord == process.env.SECRET_WORD) {
        // DB読込
        const selectedAuthData: any = await selectAsset('user', ['productkey', 'usable'], [reqToken, [1]]);
        // ecnrypt


        logger.info(`authkey: completed.`);
        // success
        res.status(200).send({
          key: '',
        });
      }


    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  return router;
};
