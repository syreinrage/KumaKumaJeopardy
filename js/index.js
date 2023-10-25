const { app, BrowserWindow } = require('electron')

app.whenReady().then(() => {
  createWindow();
}); 

function createWindow() {
  const win = new BrowserWindow({
    width: 1728,
    height: 1117,
    fullscreen: true,
  });

  win.loadFile('index.html');
  //win.webContents.openDevTools();
}