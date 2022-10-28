'user strict'

import { app, protocol, BrowserWindow, Menu, ipcMain, globalShortcut, Tray } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import * as remoteMain from '@electron/remote/main';
import { autoUpdater } from "electron-updater"
const path = require('path')

const isDevelopment = process.env.NODE_ENV !== 'production'

const ElectronStore = require('electron-store');
ElectronStore.initRenderer();

remoteMain.initialize();

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let willQuitApp = false
let win = null
let tray = null
let subWin = null

function createWindow() {
  if(!(process.platform === 'darwin')){
    Menu.setApplicationMenu(null)
  }
  win = new BrowserWindow({
    width: 1000,
    height: 650,
    frame: !(process.platform === 'darwin'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : '',
    webPreferences: {
      spellcheck: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      scrollBounce: true,
    },
    backgroundColor: '#ffffff',
    show: false
  })
  remoteMain.enable(win.webContents);
  win.title = '方寸笔迹-IdeaTrip'

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
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
    tray = new Tray(path.join(__static, 'mini_32x32.ico'))
    tray.setToolTip('方寸笔迹')

    // 托盘菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '🏠 显示主窗口',
        click: () => { win.show() }
      },
      {
        label: '💡 快速记录',
        click: () => { subWin.show() }
      },
      {
        label: '🎈 离开方寸笔迹',
        click: () => { win.destroy(); subWin.destroy(); app.quit(); tray.destroy(); }
      }
    ]);
    // 载入托盘菜单
    tray.setContextMenu(contextMenu);
    // 双击触发
    tray.on('double-click', () => {
      // 双击通知区图标实现应用的显示或隐藏
      win.isVisible() ? win.hide() : win.show();
      win.isVisible() ? win.setSkipTaskbar(false) : win.setSkipTaskbar(true);
    })
  }
}

// 创建子页面，快捷输入框
function createSubWin(){
  subWin = new BrowserWindow({
    width: 600,
    minWidth: 200,
    height: 55,
    frame: false,
    show: false,
    backgroundColor: '#f5f5f5',
    parent: win,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    subWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + 'fastRecord')
    // if (!process.env.IS_TEST) subWin.webContents.openDevTools()
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
 * 通信
 * updateWin => 刷新窗口
 * closeFastInput => 隐藏快速记录窗口
 * triggerSync => 触发同步方法
 */
ipcMain.on('updateWin', () => {
  win.reload();
})
ipcMain.on('closeFastInput', () => {
  subWin.hide();
})
ipcMain.handle('triggerSync', () => {
  subWin.webContents.send('listenSync')
})


/**
 * app 监听事件
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if(win){
    win.show()
  }
})

app.on('before-quit', () => {
  willQuitApp = true
});

app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
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
  // 注册关闭快捷窗口事件
  // globalShortcut.register('esc', function () {
  //   subWin.hide()
  // })
})

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
