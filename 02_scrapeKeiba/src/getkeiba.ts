/**
 * getkeiba.ts
 *
 * getkeiba - Getting keiba data from netkeiba. -
**/

'use strict';

/// Constants
// name space
import { myConst } from './consts/globalvariables';

/// Modules
import * as path from 'node:path'; // path
import axios from 'axios'; // http
import { config as dotenv } from 'dotenv'; // dotenv
import { BaseWindow, WebContentsView, app, ipcMain, Tray, Menu, nativeImage } from 'electron'; // electron
import ELLogger from './class/ElLogger'; // logger
import Dialog from './class/ElDialog0414'; // dialog
// env setting
dotenv({ path: path.join(__dirname, '..', '.env') });
// log level
const logLevel: string = myConst.LOG_LEVEL ?? 'all';
// loggeer instance
const logger: ELLogger = new ELLogger(myConst.COMPANY_NAME, myConst.APP_NAME, logLevel);
// dialog
const dialogMaker: Dialog = new Dialog(logger);

/*
 main
*/
// main window
let mainWindow: any = null;
// main View
let mainView: any = null;
// top View
let topView: any = null;
// left View
let leftView: any = null;
// quit flg
let isQuiting: boolean;

// make window
const createWindow = (): void => {
  try {

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // show error
      dialogMaker.showmessage('error', `${e.message}`);
    }
  }

  // minimize and stay on tray
  mainWindow.on('minimize', (event: any): void => {
    // cancel double click
    event.preventDefault();
    // hide window
    mainWindow.hide();
    // return false
    event.returnValue = false;
  });

  // close
  mainWindow.on('close', (event: any): void => {
    // not quitting
    if (!isQuiting) {
      // except for apple
      if (process.platform !== 'darwin') {
        // quit
        app.quit();
        // return false
        event.returnValue = false;
      }
    }
  });

  // when close
  mainWindow.on('closed', (): void => {
    // destryo window
    mainWindow.destroy();
  });

  // open sub window
  ipcMain.handle('open-window', () => {
    // sub window
    //const subWindow = new BrowserWindow({
    //  title: 'Sub Window',
    //});
    // set sub window
    //subWindow.loadFile(path.join(__dirname, '..', 'www', 'terminal.html'));
  });
};

// enable sandbox
app.enableSandbox();

// avoid double ignition
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // show error message
  dialogMaker.showmessage('error', 'Double ignition. break.');
  // close app
  app.quit();
}

app.whenReady().then(() => {
  // window options
  const windowOptions: any = {
    width: myConst.WINDOW_WIDTH, // window width
    height: myConst.WINDOW_HEIGHT, // window height
  }
  // Electron window
  mainWindow = new BaseWindow(windowOptions);

  // mainWindow
  mainView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  // mainview
  //mainView.webContents.openDevTools();
  mainView.webContents.loadFile(path.join(__dirname, '..', 'www', 'race.html'));
  mainWindow.contentView.addChildView(mainView);
  // top bar
  // mainWindow
  topView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  //topView.webContents.openDevTools();
  topView.webContents.loadFile(path.join(__dirname, '..', 'www', 'topbar.html'));
  mainWindow.contentView.addChildView(topView);
  // left sidebar
  // mainWindow
  leftView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  //leftView.webContents.openDevTools();
  leftView.webContents.loadFile(path.join(__dirname, '..', 'www', 'leftbar.html'));
  mainWindow.contentView.addChildView(leftView);
  // set position
  mainView.setBounds({ x: myConst.LEFTBAR_WIDTH + 10, y: myConst.TOPBAR_HEIGHT + 10, width: myConst.WINDOW_WIDTH - myConst.LEFTBAR_WIDTH - 10, height: myConst.WINDOW_HEIGHT - myConst.TOPBAR_HEIGHT - 10 });
  topView.setBounds({ x: 0, y: 0, width: myConst.WINDOW_WIDTH, height: myConst.TOPBAR_HEIGHT });
  leftView.setBounds({ x: 0, y: 0, width: myConst.LEFTBAR_WIDTH, height: myConst.WINDOW_HEIGHT });

});

// ready
app.on('ready', async () => {
  logger.info('app: electron is ready');

  // app icon
  const icon: Electron.NativeImage = nativeImage.createFromPath(
    path.join(__dirname, 'assets', 'keiba128.ico')
  );
  // tray
  const mainTray: Electron.Tray = new Tray(icon);
  // contextMenu
  const contextMenu: Electron.Menu = Menu.buildFromTemplate([
    // show
    {
      label: '表示',
      click: () => {
        mainWindow.show();
      },
    },
    // close
    {
      label: '閉じる',
      click: () => {
        isQuiting = true;
        app.quit();
      },
    },
  ]);
  // set contextMenu
  mainTray.setContextMenu(contextMenu);
  // show on double click
  mainTray.on('double-click', () => mainWindow.show());

});

// activated
app.on('activate', async () => {
  // no window
  if (BaseWindow.getAllWindows().length === 0) {
    // reboot
    createWindow();
  }
});

// quit button
app.on('before-quit', () => {
  // flg on
  isQuiting = true;
});

// closed
app.on('window-all-closed', () => {
  logger.info('app: close app');
  // quit
  app.quit();
});

/* IPC */
// beready
ipcMain.on('mainready', () => {
  // be ready
  console.log('mainready');
  mainView.webContents.send('mainready', 'main');
});

// topready
ipcMain.on('topready', () => {
  // be ready
  console.log('topready');
  topView.webContents.send('topready', 'top');
});

// leftready
ipcMain.on('leftready', () => {
  // be ready
  console.log('leftready');
  leftView.webContents.send('leftready', 'left');
});

// post communication
const httpsPost = async (
  hostname: string,
  data: any,
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    // post
    axios
      .post(hostname, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((response: any) => {
        // data
        const targetData: any = response.data;

        // recieved data
        if (targetData != 'error') {
          // complete
          resolve(targetData);
        } else {
          // error
          throw new Error('data is invalid');
        }
      })
      .catch((err: unknown) => {
        logger.error(err);
        // error
        if (err instanceof Error) {
          // error message
          dialogMaker.showmessage('error', err.message);
          // reject
          reject('httpsPost error');
        }
      });
  });
};

// get now time
const getNowTime = (): string => {
  // get now time
  return new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replaceAll('/', '-');
}

// get now date
const getNowDate = (): string => {
  // get now time
  return new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replaceAll('/', '-');
}
