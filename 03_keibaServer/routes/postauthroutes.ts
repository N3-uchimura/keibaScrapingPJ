/**
 * postauthroutes.ts
 *
 * route：secret POST Routing
**/

'use strict';

/// Constants
// namespace
import { myConst } from '../consts/globalvariables';

/// Modules
import * as path from 'path'; // path
import { Router } from 'express'; // express
import { config as dotenv } from 'dotenv'; // dotenv
import NodeCache from "node-cache"; // node-cache
import Crypto from '../class/Crypto0518'; // crypto
import Logger from '../class/Logger'; // logger
// dotenv
dotenv({ path: path.join(__dirname, '.env') });
// SQL
import { selectAsset } from '../modules/mysqlModule';
// logger setting
const logger = new Logger(myConst.APP_NAME);
// crypto
const cryptoMaker: Crypto = new Crypto(logger, process.env.CRYPTO_KEY!);
// cache
const cacheMaker: NodeCache = new NodeCache();

/// Router
// auth posing
export const postAuthRouter = () => {
  // router
  const router = Router();

  // auth key
  router.post('/authkey', async (req, res) => {
    try {
      logger.info('getsecretkey mode');
      // token
      const reqToken: any = req.body.token ?? null;
      // no token
      if (!reqToken) {
        // error
        throw new Error('auth: no token data');
      }
      // ecnrypt
      const cipher: any = cryptoMaker.encrypt(reqToken);
      // save iv to cache
      cacheMaker.set('iv', cipher.iv);

      logger.info(`getsecretkey completed.`);
      // success
      res.status(200).send({
        key: cipher.encrypted,
      });

    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  // get secret key
  router.post('/getsecretkey', async (req, res) => {
    try {
      logger.info('getsecretkey mode');
      // key
      const reqKey: any = req.body.token ?? null;
      // no key
      if (!reqKey) {
        // error
        throw new Error('auth: no key data');
      }
      // key ok
      if (reqKey == process.env.ACCESS_KEY) {
        // ecnrypt
        const cipher: any = cryptoMaker.encrypt(process.env.SECRET_KEY!);
        // save iv to cache
        cacheMaker.set('iv', cipher.iv);
        logger.info(`getsecretkey completed.`);
        // success
        res.status(200).send({
          key: cipher.encrypted,
        });
      } else {
        // error
        throw new Error('auth: invalid key');
      }

    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  // get secret iv
  router.post('/getsecretiv', async (_, res) => {
    try {
      logger.info('getsecretiv mode');
      // save iv to cache
      const secretIv: string = cacheMaker.get('iv') ?? '';
      logger.info(`getsecretiv completed.`);
      // success
      res.status(200).send({
        iv: secretIv,
      });

    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  return router;
};
