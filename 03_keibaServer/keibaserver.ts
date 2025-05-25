/**
 * yomeserver.ts
 **
 * function：メイン
**/

'use strict';

// 名前空間
import { myConst } from './consts/globalvariables';

// モジュール
import * as path from 'path'; // path
import express from 'express'; //express
import { config as dotenv } from 'dotenv'; // dotenv
import helmet from 'helmet'; // helmet
import Logger from './class/Logger'; // logger
import { getRouter } from './routes/getroutes'; // router
import { postRaceRouter } from './routes/postraceroutes'; // router
// モジュール設定
dotenv({ path: path.join(__dirname, '.env') }); // 環境変数
const logger: Logger = new Logger(myConst.APP_NAME); // ロガー
logger.info('configuration started');
const PORT: number = Number(process.env.SERVER_PORT); // ポート番号
// express設定
const app: express.Express = express(); // express
app.use(express.json()); // json設定
app.use(
  express.urlencoded({
    extended: true, // body parser使用
  })
);
app.set('view engine', 'ejs'); // ejs使用
// XSS対策
app.use(helmet());
logger.info('configuration completed');

/// GET
app.use('/', getRouter());
/// POST
// レース関係
app.use('/race/', postRaceRouter());

// 404ハンドラー
app.all(/(.*)/, (req, res) => {
  logger.info('error occured');
  // 404エラー
  res.render('404', {
    title: '404エラー',
  });
});

// エラーハンドラ
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    //logger.error(err);
    res.send('error');
  }
);

// 3000番待機
app.listen(PORT, () => {
  logger.info(`${process.env.SERVER_NAME} listening at ${process.env.DEFAULT_URL}:${PORT}`);
});
