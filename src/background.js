'user strict'

import { app, protocol, BrowserWindow, Menu, dialog, ipcMain, globalShortcut, Tray } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import * as remoteMain from '@electron/remote/main';
import { autoUpdater } from "electron-updater"
const path = require('path')

const isDevelopment = process.env.NODE_ENV !== 'production'
app.name = '方寸笔迹-IdeaTrip'

const ElectronStore = require('electron-store');
ElectronStore.initRenderer();

remoteMain.initialize();

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let willQuitApp = false
let win = null
let tray = null
let subWin = null

function createWindow() {
  // Create the browser window.
  if(!(process.platform === 'darwin')){
    Menu.setApplicationMenu(null)
  }
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: !(process.platform === 'darwin'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : '',
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      spellcheck: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false
    },
    backgroundColor: '#ffffff',
    show: false // newBrowserWindow创建后先隐藏
  })
  remoteMain.enable(win.webContents);

  // win.webContents.openDevTools()
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('close', (e) => {
    if (willQuitApp) {
      win = null
    }else{
      e.preventDefault();
      win.hide();
    }
  })
  win.on('ready-to-show', function () {
    win.show() // 初始化后再显示
  })

  // windows 环境下创建系统托盘
  if(!(process.platform === 'darwin')){
    tray = new Tray(path.join(__static, 'fangcun.ico'))
    tray.setToolTip('方寸笔迹')
    // 托盘菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示',
        click: () => { win.show() }
      },
      {
        label: '退出',
        click: () => { win.destroy(); subWin.destroy(); app.quit(); tray.destroy(); }
      }
    ]);
    // 载入托盘菜单
    tray.setContextMenu(contextMenu);
    // 双击触发
    tray.on('double-click', () => {
      // 双击通知区图标实现应用的显示或隐藏
      win.isVisible() ? win.hide() : win.show()
      win.isVisible() ? win.setSkipTaskbar(false) : win.setSkipTaskbar(true);
    })
  }
}
ipcMain.on('updateWin', () => {
  win.reload();
})

// 创建子页面，快捷输入框
function createSubWin(){
  subWin = new BrowserWindow({
    width: 600,
    minWidth: 200,
    height: 60,
    frame: false,
    show: false,
    backgroundColor: '#f5f5f5',
    parent: win,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    subWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + 'fastRecord')
    if (!process.env.IS_TEST) subWin.webContents.openDevTools()
  } else {
    createProtocol('app')
    subWin.loadURL('app://./fastRecord.html')
  }

  subWin.on('close', (e) => {
    if (willQuitApp) {
      subWin = null
    }else{
      e.preventDefault();
      subWin.hide();
    }
  })
  subWin.on('blur', (e) => {
    e.preventDefault();
    subWin.hide();
  })
}
ipcMain.on('closeFastInput', () => {
  subWin.hide();
})


const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时,将会聚焦到mainWindow这个窗口
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
      win.show()
    }
  })
}


/**
 * 两个渲染进程之间的通信
 * triggerSync => 触发同步方法
 */
ipcMain.handle('triggerSync', () => {
  subWin.webContents.send('listenSync')
})



// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (BrowserWindow.getAllWindows().length === 0) createWindow()
  if(win){
    win.show()
  }
})

app.on('before-quit', () => {
  // subWin.destroy()
  // subWin = null
  willQuitApp = true
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  await createWindow()

  // 运行APP检测更新。
  await autoUpdater.checkForUpdates()

  createSubWin()

  // 注册打开快捷窗口事件
  globalShortcut.register('Alt+F', function () {
    subWin.show()
  })
})


// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

app.on('will-quit', function () {
  globalShortcut.unregisterAll()
})



// 更新应用
autoUpdater.autoDownload = false // 关闭自动更新
autoUpdater.autoInstallOnAppQuit = true // APP退出的时候自动安装
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://stor-client.fang-cun.net/update/'
})

// 发送消息给渲染线程
function sendStatusToWindow(status, params) {
  win.webContents.send(status, params)
}

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('autoUpdater-canUpdate', info)
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('autoUpdater-error', err)
})
autoUpdater.on('download-progress', (progressObj) => {
  console.log('progressObj', progressObj)
  sendStatusToWindow('autoUpdater-progress', progressObj)
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('autoUpdater-downloaded')
})

// 发起更新程序
ipcMain.once('autoUpdater-toDownload', () => {
  autoUpdater.downloadUpdate()
})
// 退出程序
ipcMain.on('exit-app', () => {
  autoUpdater.quitAndInstall()
  if (process.platform === 'darwin') {
    setTimeout(() => {
      app.quit()
    }, 1500)
  }
})
