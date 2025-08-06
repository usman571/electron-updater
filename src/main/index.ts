// src/main/index.ts
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log' // Add proper import
import icon from '../../resources/icon.png?asset'

// Configure logging properly
log.transports.file.level = 'info'
autoUpdater.logger = log

// Configure auto-updater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Only add extra console logging in dev mode
if (is.dev) {
  // In dev mode, also log to console
  log.transports.console.level = 'debug'

  // For testing in development, you can force dev update config
  // autoUpdater.forceDevUpdateConfig = true
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow && mainWindow.show()
  })

  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Setup auto-updater after window is created
  setupAutoUpdater()
}

function setupAutoUpdater(): void {
  // Check for updates after app starts (only in production)
  if (!is.dev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates()
    }, 3000)
  }

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
    sendStatusToWindow('checking-for-update', 'Checking for updates...')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info)
    sendStatusToWindow('update-available', {
      version: info.version,
      releaseDate: info.releaseDate
    })

    dialog
      .showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Available',
        message: `Version ${info.version} is available. Download now?`,
        buttons: ['Download', 'Later']
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  autoUpdater.on('update-not-available', () => {
    log.info('Update not available')
    sendStatusToWindow('update-not-available', 'App is up to date!')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`
    log.info(logMessage)

    sendStatusToWindow('download-progress', {
      bytesPerSecond: progressObj.bytesPerSecond,
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded')
    sendStatusToWindow('update-downloaded', {
      version: info.version
    })

    dialog
      .showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. Restart now to apply the update?',
        buttons: ['Restart', 'Later']
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err)
    sendStatusToWindow('update-error', err.message)
  })
}

function sendStatusToWindow(event: string, data: any): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-event', { event, data })
  }
}

// IPC Handlers for renderer
ipcMain.handle('app:getVersion', () => app.getVersion())
ipcMain.handle('app:checkForUpdates', () => {
  if (!is.dev) {
    return autoUpdater.checkForUpdates()
  }
  return null
})
ipcMain.handle('app:downloadUpdate', () => {
  return autoUpdater.downloadUpdate()
})
ipcMain.handle('app:quitAndInstall', () => {
  autoUpdater.quitAndInstall()
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
