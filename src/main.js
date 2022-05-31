const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron')
const path = require('path')

app.whenReady().then(() => { createTray();createWindow() })

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    icon: path.join(__dirname, './logo.png'),
    webPreferences: {
        preload: path.join(__dirname, './preload.js')
    }
  })

  win.loadFile('src/index.html')
}

let tray;
const createTray = () => {
    tray = new Tray(path.join(__dirname, './logo.png'));
    const menu = Menu.buildFromTemplate(trayMenuTemplate);
    tray.setContextMenu(menu);
}
const trayMenuTemplate = [{
    label: 'about',
    type: 'normal',
    click: function() {
        alert('hostsbox');
    }
}, {
    label: 'quit',
    type: 'normal',
    click: function() {
        app.quit();
    }
}];

ipcMain.on('userdata-message', (event, args) => {
    event.reply('userdata-reply', app.getPath('userData'))
});
