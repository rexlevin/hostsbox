const { app, BrowserWindow, ipcMain, Menu, Tray, dialog } = require('electron')
const path = require('path')
const package = require('./package.json')

// 清除启动时控制台的“Electron Security Warning (Insecure Content-Security-Policy)”报错信息
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win;

const Store = require('electron-store');
Store.initRenderer();

app.whenReady().then(() => { createTray();createWindow() })

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

const createWindow = () => {
    Menu.setApplicationMenu(null);
    win = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        icon: path.join(__dirname, './src/logo.png'),
        webPreferences: {
            preload: path.join(__dirname, './src/preload.js')
        },
        useContentSize: true
    })
    win.loadFile('src/index.html')
}

let tray;
const createTray = () => {
    tray = new Tray(path.join(__dirname, './src/logo.png'));
    const menu = Menu.buildFromTemplate(trayMenuTemplate);
    tray.setContextMenu(menu);
}
const trayMenuTemplate = [{
    label: 'about',
    type: 'normal',
    click: function() {
        dialog.showMessageBox({
            type: 'info',
            title: '关于',
            message: package.name + ':' + package.version + '\n' + package.description + '\nnode:' + process.versions['node'] + '\nchrome:' + process.versions['chrome'] + '\nelectron:' + process.versions['electron']
        });
    }
}, {
    label: 'quit',
    type: 'normal',
    click: function() {
        app.quit();
    }
}];

// 获取app数据目录
ipcMain.on('userdata-message', (event, args) => {
    console.info('userData====' + app.getPath('userData'));
    event.reply('userdata-reply', app.getPath('userData'))
});
ipcMain.on('devTools', () => {
    if(win.webContents.isDevToolsOpened()) win.webContents.closeDevTools();
    else win.webContents.openDevTools();
});
ipcMain.on('reload', () => {
    win.reload();
    // win.webContents.reload();
});
// 退出app
ipcMain.on('exit', (event, args) => {
    app.quit();
});
