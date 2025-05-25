/**
 * postraceroutes.ts
 *
 * route：開催情報POSTルーティング用
**/

'use strict';

// 名前空間
import { myConst } from '../consts/globalvariables';

// モジュール定義
import { Router } from 'express'; // express
import Logger from '../class/Logger'; // logger
// SQL読込
import { selectAsset } from '../modules/mysqlModule';
// ロガー設定
const logger = new Logger(myConst.APP_NAME);

// レースポストルータ
export const postRaceRouter = () => {
  // ルータ
  const router = Router();

  // 開催レースID取得
  router.post('/getracingno', async (req, res) => {
    try {
      // モード
      logger.info('getracingno mode');
      // 開催日
      const reqraceDate: any = req.body.date ?? null;
      logger.trace(`getracingno: date: ${reqraceDate}`);

      // データ無し
      if (!reqraceDate) {
        throw new Error('reqraceDate: no necessary data');
      }
      // 開催年
      const raceYear: string = String(reqraceDate).substring(0, 4);

      // DB検索
      const raceNoArray: any = await Promise.all(
        myConst.DB_NAMES.map(async (table: string): Promise<string> => {
          return new Promise(async (resolve, reject) => {
            const selectedRace: any = await selectAsset(table, ['racingdate', 'usable'], [[reqraceDate], [1]], ['place_id', 'stages', 'days']);
            if (selectedRace.length > 0) {
              // 競馬場ID
              const placeid: string = String(selectedRace[0].place_id).padStart(2, '0');
              // 開催回
              const raceStage: string = String(selectedRace[0].stages).padStart(2, '0');
              // 開催日数
              const raceDays: string = String(selectedRace[0].days).padStart(2, '0');
              // 対象データ取得
              resolve(raceYear + placeid + raceStage + raceDays);
            }
          })
        }));

      logger.info(`racingno get completed.`);
      logger.trace(raceNoArray);
      // 完了
      res.status(200).send(raceNoArray);

    } catch (e: unknown) {
      // エラー
      res.status(200).send('error');
      logger.error(e);
    }
  });

  return router;
};
