import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getVersion: () => Promise<string>
      checkForUpdates: () => void
      // Add other API methods as needed
    }
  }
}
