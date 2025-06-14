/**
 * management.ts
 *
 * route：management Routing
**/

'use strict';

/// Constants
// namespace
import { myConst } from '../consts/globalvariables';

/// Modules
import * as path from 'node:path'; // path
import { Router } from 'express'; // express
import { config as dotenv } from 'dotenv'; // dotenv
import Crypto from '../class/Crypto0612'; // crypto
import Logger from '../class/Logger'; // logger
// SQL
import { selectAsset, updateData, insertData } from '../modules/mysqlModule';
// dotenv
dotenv({ path: path.join(__dirname, '.env') });
// logger setting
const logger = new Logger(myConst.APP_NAME);
// crypto
const cryptoMaker: Crypto = new Crypto(logger, process.env.CRYPTO_KEY!);

/// Router
// management router
export const managementRouter = () => {
  // router
  const router = Router();

  // add productkey
  router.get('/', async (_, res) => {
    try {
      logger.info('manage: top');
      // select from DB
      const userList: any = selectAsset('user', ['usable'], [[1]], ['id', 'productkey', 'buyed']);
      // key number
      res.render('manage', {});

    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  // publish productkey
  router.post('/pubproductkey', async (req, res) => {
    try {
      logger.info('manage: pubproductkey start');
      // user select promises
      let selectpromises: Promise<any>[] = [];
      // user update promises
      let updatepromises: Promise<any>[] = [];
      // key number
      const reqNumbers: any = req.body.number ?? null;
      // secret
      const reqSecret: any = req.body.secret ?? null;
      logger.trace(`manage: number: ${reqNumbers}`);
      logger.trace(`manage: secret: ${reqSecret}`);

      // no data
      if (!reqNumbers || !reqSecret) {
        throw new Error('manage: no necessary data');
      }
      // secret check
      if (reqSecret != process.env.MANAGE_ACCESS_KEY) {
        throw new Error('manage: secret differ');
      }
      // key number
      const keyNumbers: number = Number(reqNumbers);
      // numbers for loop
      const keynums: number[] = [...Array(keyNumbers)].map((_, i) => i + 1);
      // select loop
      for (const _ of keynums) {
        // select from DB
        selectpromises.push(selectAsset('user', ['usable'], [[1]], ['userkey', 'productkey']));
      }
      // select all DB
      const selectedKeys = await Promise.all(selectpromises);
      // formattedDate
      const dateString: string = (new Date).toISOString().slice(0, 10);

      // update loop
      for (const _ of keynums) {
        // update DB
        updatepromises.push(updateData('user', ['usable'], [1], ['buyed', 'enabled'], [dateString, 1]));
      }
      // update all DB
      await Promise.all(updatepromises);
      res.send(selectedKeys);
      logger.info(`manage addproductkey completed.`);

    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  // add productkey
  router.post('/addproductkey', async (req, res) => {
    try {
      logger.info('manage: addproductkey start');
      // insert promises
      let promises: Promise<any>[] = [];
      // key number
      const reqNumbers: any = req.body.number ?? null;
      // secret
      const reqSecret: any = req.body.secret ?? null;
      logger.trace(`manage: number: ${reqNumbers}`);
      logger.trace(`manage: secret: ${reqSecret}`);

      // no data
      if (!reqNumbers || !reqSecret) {
        throw new Error('manage: no necessary data');
      }
      // secret check
      if (reqSecret != process.env.MANAGE_ACCESS_KEY) {
        throw new Error('manage: secret differ');
      }
      // key number
      const keyNumbers: number = Number(reqNumbers);
      // numbers for loop
      const keynums: number[] = [...Array(keyNumbers)].map((_, i) => i + 1);

      // register loop
      for (const _ of keynums) {
        // make userkey
        const userKey: string = await cryptoMaker.random(10);
        // make serial string
        const pdKey: string = await cryptoMaker.random(20);
        // make serialize
        const serialNo: string = pdKey.replace(/(\d{4})/g, '$1-').replace(/-$/, '');
        // select from DB
        promises.push(insertData('user', ['userkey', 'productkey', 'secret', 'buyed', 'enabled', 'usable'], [userKey, serialNo, '', '2025-01-01', 0, 1]));
      }
      // insert all DB
      await Promise.all(promises);
      logger.info(`manage addproductkey completed.`);
      res.send('ok');

    } catch (e: unknown) {
      // error
      res.status(200).send('error');
      logger.error(e);
    }
  });

  return router;
};
