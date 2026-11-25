"use strict";
const { app, BrowserWindow, shell, Menu, session } = require('electron');
const path = require('path');

const isDev = process.env.NEIN_DESKTOP_DEV === '1';
const DEV_URL = 'http://127.0.0.1:3000';
let window = null;

function createWindow() {
    window = new BrowserWindow({
        width: 1480,
        height: 940,
        minWidth: 900,
        minHeight: 650,
        title: 'NEiN防災 — Desktop Edition',
        backgroundColor: '#090D16',
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            devTools: isDev
        }
    });

    window.once('ready-to-show', () => window.show());
    window.webContents.on('did-fail-load', (_event, code, description, url, isMainFrame) => {
        if (isMainFrame) console.error('[NEiN] Could not load app:', code, description, url);
    });
    window.webContents.setWindowOpenHandler(({url}) => {
        if (/^https:\/\//i.test(url)) shell.openExternal(url).catch(console.error);
        return { action: 'deny' };
    });
    window.webContents.on('will-navigate', (event, url) => {
        const allowed = isDev ? url.startsWith(DEV_URL) : url.startsWith('file://');
        if (!allowed) {
            event.preventDefault();
            if (/^https:\/\//i.test(url)) shell.openExternal(url).catch(console.error);
        }
    });

    if (isDev) {
        window.loadURL(DEV_URL);
    } else {
        window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => app.quit());
