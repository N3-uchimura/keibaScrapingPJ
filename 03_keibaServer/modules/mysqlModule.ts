/**
 * mysqlModule.ts
 *
 * module：MYSQL
 **/

'use strict';

// namespace
const MODULE_NAME: string = 'mysql';

// import global interface
import { } from '../@types/globaljoinsql.d';

// modules
import * as path from 'path'; // path
import { config as dotenv } from 'dotenv'; // dotenv
import Logger from '../class/Logger'; // logger
import SQL from '../class/MySqlJoin0612'; // sql
// dotenv setting
dotenv({ path: path.join(__dirname, '../.env') });
// logger
const logger: Logger = new Logger(MODULE_NAME);

// DB setting
const myDB: SQL = new SQL(
  process.env.SQL_HOST!, // hostname
  process.env.SQL_COMMON_USER!, // username
  process.env.SQL_COMMON_PASS!, // userpass
  Number(process.env.SQL_PORT), // portNO
  process.env.SQL_DBNAME!, // DB name
  logger, // logger
);

/* count */
// count assets
export const countAssets = async (table: string, columns: string[], data: any[][]): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('mysql: countAssets mode');
      // args
      const assetCountArgs: countargs = {
        table: table, // table
        columns: columns, // columns
        values: data, // values
      };
      // get count
      const targetUserCount: number = await myDB.countDB(assetCountArgs);
      // get number of assets
      resolve(targetUserCount);
      logger.debug('mysql: countAssets end');

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject(e);
    }
  });
};

/* select */
// select assets
export const selectAsset = async (table: string, columns: string[], values: any[][], fields?: string[], limit?: number): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('mysql: selectAsset mode');
      // 対象データ
      const assetSelectArgs: selectargs = {
        table: table, // table
        columns: columns, // columns
        values: values, // values
        fields: fields, // fields
        limit: limit // limit
      };
      // get target assets
      const targetAssetData: any = await myDB.selectDB(assetSelectArgs);
      // error
      if (targetAssetData == 'error') {
        // DB error
        throw new Error('mysql: selectAsset error');
      } else if (targetAssetData == 'empty') {
        // empty
        resolve([]);
        logger.debug('mysql: selectAsset empty');
      } else {
        // result
        resolve(targetAssetData);
        logger.debug('mysql: selectAsset end');
      }

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject(e);
    }
  });
};

// select assets with join
export const selectJoinAsset = async (table: string, jointable: string, columns: string[], values: any[][], joincolumns: string[], joinvalues: any[][], fields: string[], limit?: number): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('mysql: selectJoinAsset mode');
      // join arg
      const selectJoinAssetObj: joinargs = {
        table: table, // table
        columns: columns, // columns
        values: values, // values
        originid: `${jointable}_id`, // join base id
        jointable: jointable, // joined table
        joincolumns: joincolumns, // joined columns
        joinvalues: joinvalues, // joined values
        joinid: 'id', // join target id
        fields: fields, // fields
        limit: limit // limit
      };
      // extract joined assets
      const selectedJoinAssetData: any = await myDB.selectJoinDB(selectJoinAssetObj);
      // error
      if (selectedJoinAssetData == 'error') {
        // DB error
        throw new Error('mysql: selectJoinAsset error');
      } else if (selectedJoinAssetData == 'empty') {
        // empty
        resolve([]);
        logger.debug('mysql: selectJoinAsset empty');
      } else {
        // success
        resolve(selectedJoinAssetData);
        logger.debug('mysql: selectJoinAsset end');
      }

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject(e);
    }
  });
};

/* update */
// update asset
export const updateData = async (table: string, selColumns: string[], selData: any, setColumns: string[], setData: any[]): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // update arg
      const updateAssetArgs: updateargs = {
        table: table, // table
        setcol: setColumns, // set columns
        setval: setData, // set values
        selcol: selColumns, // select columns
        selval: selData, // select values
      };
      // update 
      const updateUserResult = await myDB.updateDB(updateAssetArgs);
      // error
      if (updateUserResult == 'error') {
        // DB error
        throw new Error('mysql: updateData error');
      } else if (updateUserResult == 'empty') {
        // empty
        logger.debug('mysql: updateData empty');
      }
      // success
      resolve();
      logger.debug('mysql: updateData end');

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject();
    }
  });
};

/* insert */
// insert asset
export const insertData = async (table: string, columns: string[], data: any): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // insert arg
      const insertDataArgs: insertargs = {
        table: table, // table
        columns: columns, // columns
        values: data, // data
      };
      // insert 
      const insertedTokenId: any = await myDB.insertDB(insertDataArgs);
      // error or empty
      if (insertedTokenId == 'error' || insertedTokenId == 'empty') {
        // throw error
        throw new Error('insertData: usertoken insert error');
      }
      // success
      resolve(insertedTokenId);
      logger.debug('mysql: insertData end');

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject();
    }
  });
};
