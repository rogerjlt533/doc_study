"user strict";

import {
  app,
  protocol,
  BrowserWindow,
  Menu,
  ipcMain,
  globalShortcut,
  Tray,
  session
} from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";
import * as remoteMain from "@electron/remote/main";
import { autoUpdater } from "electron-updater";

require('v8-compile-cache')

const path = require("path")
const isDevelopment = process.env.NODE_ENV !== "production";

const ElectronStore = require("electron-store");
ElectronStore.initRenderer();

remoteMain.initialize();

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);


let willQuitApp = false;
let mainWin = null;
let fastWin = null;
let tagManageWin = null;
let serviceWin = null;
let tray = null;

async function createWindow() {
  if (!(process.platform === "darwin")) {
    Menu.setApplicationMenu(null);
  }
  mainWin = new BrowserWindow({
    width: 1100,
    minWidth: 900,
    height: 650,
    frame: !(process.platform === "darwin"),
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "",
    webPreferences: {
      spellcheck: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      scrollBounce: true,
    },
    backgroundColor: "#ffffff",
    show: false,
  });
  mainWin.title = "方寸笔迹-IdeaTrip";
  remoteMain.enable(mainWin.webContents)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    mainWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) mainWin.webContents.openDevTools();
  } else {
    createProtocol("app");
    mainWin.loadURL("app://./index.html");
  }

  mainWin.on("close", (e) => {
    if (willQuitApp) {
      mainWin = null;
    } else {
      e.preventDefault();
      mainWin.hide()
      tagManageWin.hide()
      serviceWin.hide()
    }
  });
  mainWin.on("ready-to-show", function () {
    mainWin.show(); // 初始化后再显示
  });

  // windows 环境下创建系统托盘
  if (!(process.platform === "darwin")) {
    tray = new Tray(path.join(__static, "mini_32x32.ico"));
    tray.setToolTip("方寸笔迹");

    // 托盘菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "🏠 显示主窗口",
        click: () => {
          mainWin.show();
        },
      },
      {
        label: "💡 快速记录",
        click: () => {
          fastWin.show();
        },
      },
      {
        label: "🎈 离开方寸笔迹",
        click: () => {
          mainWin.destroy();
          fastWin.destroy();
          serviceWin.destroy();
          tagManageWin.destroy();
          app.quit();
          tray.destroy();
        },
      },
    ]);
    // 载入托盘菜单
    tray.setContextMenu(contextMenu);
    // 双击触发
    tray.on("double-click", () => {
      // 双击通知区图标实现应用的显示或隐藏
      mainWin.isVisible() ? mainWin.hide() : mainWin.show();
      mainWin.isVisible()
          ? mainWin.setSkipTaskbar(false)
          : mainWin.setSkipTaskbar(true);
    });
  }
}

// 创建子页面，快捷输入框
function createFastWin() {
  fastWin = new BrowserWindow({
    width: 600,
    minWidth: 200,
    height: 57,
    frame: false,
    show: false,
    backgroundColor: "#f5f5f5",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    fastWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + "fastWin");
  } else {
    createProtocol("app");
    fastWin.loadURL("app://./fastWin.html");
  }
  fastWin.on("close", (e) => {
    if (willQuitApp) {
      fastWin = null;
    } else {
      e.preventDefault();
      fastWin.hide();
    }
  });
  fastWin.on("blur", (e) => {
    e.preventDefault();
    fastWin.hide();
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时,将会聚焦到mainWindow这个窗口
    if (mainWin) {
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.focus();
      mainWin.show();
    }
  });
}

// 创建一个标签管理器
function createTagManageWin(){
  tagManageWin = new BrowserWindow({
    width: 300,
    height: 400,
    show: false,
    title: "方寸笔迹-标签管理器",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    }
  })

  tagManageWin.on("close", (e) => {
    if (willQuitApp) {
      tagManageWin = null;
    } else {
      e.preventDefault();
      tagManageWin.hide();
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    tagManageWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + "tagManageWin");
  } else {
    createProtocol("app");
    tagManageWin.loadURL("app://./tagManageWin.html");
  }
}

// 创建一个渲染进程，专门用于调用后台的接口，保证主界面不卡顿
function createServiceWin(){
  serviceWin = new BrowserWindow({
    width: 400,
    height: 300,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    }
  })

  serviceWin.on("close", (e) => {
    if (willQuitApp) {
      serviceWin = null;
    } else {
      e.preventDefault();
      serviceWin.hide();
    }
  });

  serviceWin.webContents.openDevTools();
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    serviceWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + "serviceWin");
  } else {
    createProtocol("app");
    serviceWin.loadURL("app://./serviceWin.html");
  }
}


/**
 * 通信
 * closeAllWin => 隐藏所有的窗口
 * updateWin => 刷新窗口
 * closeFastInput => 隐藏快速记录窗口
 * openTagManage => 打开标签管理器
 * sendParamsTagManage => 传递数据标签管理器
 * tagManageClickItem => 标签管理器点击标签
 * tagManageSetTopTag => 设置标签置顶
 * tagManageClose => 关闭标签管理器
 * tagManageSearch => 关键词查找
 * startSyncMain => 开启上下行同步
 */
ipcMain.on('closeAllWin', () => {
  fastWin.hide()
  tagManageWin.hide()
  serviceWin.hide()
})
ipcMain.on("updateWin", () => {
  mainWin.reload()
});
ipcMain.on("fastSaveNote", (event, params) => {
  fastWin.hide()
  mainWin.webContents.send("handleFastSaveNote", params)
});
ipcMain.on('startSyncMain', (event, params) => {
  fastWin.webContents.send("startSync", params)
})
ipcMain.on("openTagManage", (event, params) => {
  tagManageWin.show()
});
ipcMain.on("sendParamsTagManage", (event, params) => {
  tagManageWin.webContents.send("receiveTagManageParams", params)
});
ipcMain.on('tagManageClickItem', (event, params) => {
  mainWin.webContents.send("handleTagManageItem", params)
})
ipcMain.on('tagManageSetTopTag', (event, params) => {
  mainWin.webContents.send("handleSetTopTag", params)
})
ipcMain.on('tagManageSearch', (event, params) => {
  mainWin.webContents.send("handleSearchTagManage", params)
})
ipcMain.on("tagManageClose", (event, params) => {
  tagManageWin.hide()
});

/**
 * 接口请求通信
 */
ipcMain.on("mainRequest", async (event, params) => {
  serviceWin.webContents.send("serviceRequest", params)
})
ipcMain.on("serviceResponse", (event, params) => {
  mainWin.webContents.send("mainResponse", params)
})



/**
 * app 监听事件
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWin) {
    mainWin.show();
  }
});

app.on("before-quit", () => {
  mainWin.webContents.send("willQuitProgram")
  willQuitApp = true
});

app.on("will-quit", function () {
  globalShortcut.unregisterAll();
});

app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS3_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }

  // 清除文件缓存
  await session.defaultSession.clearCache()

  await createServiceWin()
  await createWindow()
  await createTagManageWin()
  await createFastWin()

  // 运行APP检测更新。
  await autoUpdater.checkForUpdates()

  // 注册打开快捷窗口事件
  globalShortcut.register("Alt+F", function () {
    fastWin.show();
  });
  // 注册打开后端窗口事件
  globalShortcut.register("Ctrl+Shift+[+]", function () {
    serviceWin.show();
  });
});

if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}




// 更新应用
autoUpdater.autoDownload = false; // 关闭自动更新
autoUpdater.autoInstallOnAppQuit = true; // APP退出的时候自动安装
autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://stor-client.fang-cun.net/update/",
});
ipcMain.on('checkUpdate', async () => {
  await autoUpdater.checkForUpdates()
})

// 发送消息给渲染线程
function sendStatusToWindow(status, params) {
  mainWin.webContents.send(status, params);
}

// 当开始检查更新的时候触发
// autoUpdater.on("checking-for-update", (info) => {
// 	sendStatusToWindow("autoUpdater-canUpdate", info);
// });
// 当有可用更新的时候触发，更新将自动下载
autoUpdater.on("update-available", (info) => {
  sendStatusToWindow("autoUpdater-canUpdate", info);
});
// 当没有可用更新的时候触发
autoUpdater.on("update-not-available", (info) => {
  sendStatusToWindow("autoUpdater-noCanUpdate", info);
});
// 在更新下载完成的时候触发
autoUpdater.on("update-downloaded", (info) => {
  sendStatusToWindow("autoUpdater-downloaded");
});
// 当更新发生错误的时候触发
autoUpdater.on("error", (err) => {
  sendStatusToWindow("autoUpdater-error", err);
});
autoUpdater.on("download-progress", (progressObj) => {
  sendStatusToWindow("autoUpdater-progress", progressObj);
});
// 发起更新程序
ipcMain.once("autoUpdater-toDownload", () => {
  autoUpdater.downloadUpdate();
});
// 退出程序
ipcMain.on("exit-app", () => {
  autoUpdater.quitAndInstall()
  if (process.platform === "darwin") {
    setTimeout(() => {
      app.quit();
    }, 1500);
  }
});
