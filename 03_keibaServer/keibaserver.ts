/**
 * keibaserver.ts
 **
 * function：main
**/

'use strict';

// namespace
import { myConst } from './consts/globalvariables';

// modules
import * as path from 'path'; // path
import express from 'express'; //express
import { config as dotenv } from 'dotenv'; // dotenv
import helmet from 'helmet'; // helmet
import Logger from './class/Logger'; // logger
import { getRouter } from './routes/getroutes'; // router
import { postRaceRouter } from './routes/postraceroutes'; // race router
import { postAuthRouter } from './routes/postauthroutes'; // auth router

// dotenv
dotenv({ path: path.join(__dirname, '.env') });
// logger setting
const logger: Logger = new Logger(myConst.APP_NAME);
logger.info('configuration started');
// port no
const PORT: number = Number(process.env.SERVER_PORT);
// express
const app: express.Express = express();
app.use(express.json()); // json
app.use(
  express.urlencoded({
    extended: true, // body parser
  })
);
// XSS
app.use(helmet());
logger.info('configuration completed');

/// GET
app.use('/', getRouter());

/// POST
// race root
app.use('/race/', postRaceRouter());
// auth root
app.use('/auth/', postAuthRouter());

// 404 handler
app.all(/(.*)/, (_, res) => {
  logger.info('error occured');
  // 404 error
  res.render('404', {
    title: '404 error',
  });
});

// error handler
app.use(
  (
    err: Error,
    _: express.Request,
    res: express.Response,
    __: express.NextFunction,
  ) => {
    logger.error(err);
    res.send('error');
  }
);

// wait on port
app.listen(PORT, () => {
  logger.info(`${process.env.SERVER_NAME} listening at ${process.env.DEFAULT_URL}:${PORT}`);
});
