/**
 * getroutes.ts
 *
 * route：GETルーティング用
**/

'use strict';

// 名前空間
import { myConst } from '../consts/globalvariables';

// モジュール定義
import { Router } from 'express';
import Logger from '../class/Logger'; // logger
// ロガー
const logger: Logger = new Logger(myConst.APP_NAME);

// GETルータ
export const getRouter = () => {
  // ルータ
  const router = Router();

  // getテスト
  router.get('/test', async (_, res) => {
    try {
      logger.info('test connected');

    } catch (e: unknown) {
      // エラー
      logger.error(e);
    }
  });

  return router;
};