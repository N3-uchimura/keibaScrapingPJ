/**
 * keibaserver.ts
 **
 * function：main
**/

'use strict';

// namespace
import { myConst } from './consts/globalvariables';

// modules
import * as path from 'node:path'; // path
import express from 'express'; //express
import basicAuth from 'basic-auth-connect'; // basic auth
import { config as dotenv } from 'dotenv'; // dotenv
import helmet from 'helmet'; // helmet
import Logger from './class/Logger'; // logger
import { raceRouter } from './routes/raceroutes'; // race router
import { horseRouter } from './routes/horseroutes'; // horse router
import { authRouter } from './routes/authroutes'; // auth router
import { updateRouter } from './routes/updateroutes'; // management router
import { managementRouter } from './routes/management'; // management router

// dotenv
dotenv({ path: path.join(__dirname, '.env') });
// logger setting
const logger: Logger = new Logger(myConst.APP_NAME);
logger.info('configuration started');
// port no
const PORT: number = Number(process.env.SERVER_PORT);
// express
const app: any = express();
app.use(express.json()); // json
app.use(
  express.urlencoded({
    extended: true, // body parser
  })
);
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// XSS
app.use(helmet());

// admin
const adminApp: any = express.Router();
/// BASIC authorization
const adminId: string = process.env.ADMIN_ID!; // ID
const adminPass: string = process.env.ADMIN_PASSWORD!; // password
// admin setting
adminApp.use(basicAuth(adminId, adminPass));

/// routes
// race root
app.use('/race/', raceRouter());
// horse root
app.use('/horse/', horseRouter());
// auth root
app.use('/auth/', authRouter());
// update root
app.use('/update/', updateRouter());
// manage auth
app.use('/manage/', adminApp);
// manage
app.use('/manage/', managementRouter());
logger.info('configuration completed');

// 404 handler
app.all(/(.*)/, (_, res) => {
  try {
    logger.info('error occured');
    // 404 error
    res.render('404', {
      title: '404 error',
    });
  } catch (e) {
    logger.error(e);
  }
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
  try {
    logger.info(`${process.env.SERVER_NAME} listening at ${process.env.DEFAULT_URL}:${PORT}`);
  } catch (e) {
    logger.error(e);
  }
});
