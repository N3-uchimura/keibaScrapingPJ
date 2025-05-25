/**
 * mysqlModule.ts
 *
 * module：MYSQL用
 **/

'use strict';

// 定数
const MODULE_NAME: string = 'mysql';

// import global interface
import { } from '../@types/globaljoinsql.d';

// モジュール
import * as path from 'path'; // path
import { config as dotenv } from 'dotenv'; // dotenv
import Logger from '../class/Logger'; // logger
import SQL from '../class/MySqlJoin0427'; // sql
// モジュール設定
dotenv({ path: path.join(__dirname, '../.env') });
// ロガー
const logger: Logger = new Logger(MODULE_NAME);

// DB設定
const myDB: SQL = new SQL(
  process.env.SQL_HOST!, // ホスト名
  process.env.SQL_COMMON_USER!, // ユーザ名
  process.env.SQL_COMMON_PASS!, // ユーザパスワード
  Number(process.env.SQL_PORT), // ポートNO
  process.env.SQL_DBNAME!, // DB名
  logger, // ロガー
);

/* count */
// アセット数カウント
export const countAssets = async (table: string, columns: string[], data: any[][]): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('mysql: countAssets mode');
      // 対象データ
      const assetCountArgs: countargs = {
        table: table, // テーブル
        columns: columns, // カラム
        values: data, // 値
      };
      // 対象データ取得
      const targetUserCount: number = await myDB.countDB(assetCountArgs);
      // ユーザ数
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
// アセット選択
export const selectAsset = async (table: string, columns: string[], values: any[][], fields?: string[]): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('mysql: selectAsset mode');
      // 対象データ
      const assetSelectArgs: selectargs = {
        table: table, // テーブル
        columns: columns, // カラム
        values: values, // 値
        fields: fields // 選択カラム
      };
      // 対象データ取得
      const targetAssetData: any = await myDB.selectDB(assetSelectArgs);
      // 結果
      if (targetAssetData == 'error') {
        // DBエラー
        throw new Error('mysql: selectAsset error');
      } else if (targetAssetData == 'empty') {
        // ヒットなし
        resolve([]);
        logger.debug('mysql: selectAsset empty');
      } else {
        // 結果
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

// アセット選択
export const selectJoinAsset = async (table: string, jointable: string, columns: string[], values: any[][], joincolumns: string[], joinvalues: any[][], fields: string[]): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('mysql: selectJoinAsset mode');
      // 対象データ
      const selectJoinAssetObj: joinargs = {
        table: table, // テーブル
        columns: columns, // カラム
        values: values, // 値
        originid: `${jointable}_id`,
        jointable: jointable,
        joincolumns: joincolumns,
        joinvalues: joinvalues, // 値
        joinid: 'id',
        fields: fields,
      };
      // 該当ユーザ抽出
      const selectedJoinAssetData: any = await myDB.selectJoinDB(selectJoinAssetObj);
      // 結果
      if (selectedJoinAssetData == 'error') {
        // DBエラー
        throw new Error('mysql: selectJoinAsset error');
      } else if (selectedJoinAssetData == 'empty') {
        // ヒットなし
        resolve([]);
        logger.debug('mysql: selectJoinAsset empty');
      } else {
        // 成功
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

// アセット選択
export const selectDoubleJoinAsset = async (table: string, jointable1: string, jointable2: string, columns: string[], values: any[][], joincolumns1: string[], joinvalues1: any[][], joincolumns2: string[], joinvalues2: any[][], fields: string[]): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.debug('mysql: selectDoubleJoinAsset mode');

      // 対象データ
      const selectJoinAssetObj: joindoubleargs = {
        table: table, // テーブル
        columns: columns, // カラム
        values: values, // 値
        originid1: `${jointable1}_id`,
        originid2: `${jointable2}_id`,
        jointable1: jointable1,
        jointable2: jointable2,
        joincolumns1: joincolumns1,
        joincolumns2: joincolumns2,
        joinvalues1: joinvalues1, // 値
        joinvalues2: joinvalues2, // 値
        joinid1: `id`,
        joinid2: 'id',
        fields: fields,
      };
      // 該当ユーザ抽出
      const selectedJoinAssetData: any = await myDB.selectDoubleJoinDB(selectJoinAssetObj);
      // 結果
      if (selectedJoinAssetData == 'error') {
        // DBエラー
        throw new Error('mysql: selectDoubleJoinAsset error');
      } else if (selectedJoinAssetData == 'empty') {
        // ヒットなし
        resolve([]);
        logger.debug('mysql: selectDoubleJoinAsset empty');
      } else {
        // 成功
        resolve(selectedJoinAssetData);
        logger.debug('mysql: selectDoubleJoinAsset end');
      }

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject(e);
    }
  });
};

/* update */
// アセット更新
export const updateData = async (table: string, selColumns: string[], selData: any, setColumns: string[], setData: any[]): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 対象データ
      const updateAssetArgs: updateargs = {
        table: table, // テーブル
        setcol: setColumns, // 準備完了
        setval: setData, // 待機状態
        selcol: selColumns, // 対象
        selval: selData, // 対象値
      };
      // 更新処理
      const updateUserResult = await myDB.updateDB(updateAssetArgs);
      // 結果
      if (updateUserResult == 'error') {
        // エラー
        throw new Error('mysql: updateData error');
      } else if (updateUserResult == 'empty') {
        // 対象なし
        logger.debug('mysql: updateData empty');
      }
      // 成功
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
// アセット更新
export const insertData = async (table: string, columns: string[], data: any): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 対象データ
      const insertDataArgs: insertargs = {
        table: table, // テーブル
        columns: columns, // カラム
        values: data, // 値
      };
      // インサートID
      const insertedTokenId: any = await myDB.insertDB(insertDataArgs);
      // 結果
      if (insertedTokenId == 'error' || insertedTokenId == 'empty') {
        // エラー
        throw new Error('insertData: usertoken insert error');
      }
      // 成功
      resolve(insertedTokenId);
      logger.debug('mysql: insertData end');

    } catch (e: unknown) {
      logger.error(e);
      // error
      reject();
    }
  });
};
