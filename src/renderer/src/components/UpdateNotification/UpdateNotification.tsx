// src/renderer/src/components/UpdateNotification/UpdateNotification.tsx
import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { X, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { ElectronAPI } from '@electron-toolkit/preload'

interface UpdateInfo {
   event: string
   data: any
}

// Updated global interface with all required API methods
declare global {
   interface Window {
      electron: ElectronAPI
      api: {
         getVersion: () => Promise<string>
         checkForUpdates: () => void
         onUpdateEvent: (callback: (info: UpdateInfo) => void) => void
         removeUpdateListeners: () => void
         downloadUpdate: () => void
         quitAndInstall: () => void
      }
   }
}

// Simple toast implementation (since sonner seems to be missing)
const toast = {
   info: (message: string) => console.log('INFO:', message),
   success: (message: string) => console.log('SUCCESS:', message),
   error: (message: string) => console.error('ERROR:', message),
}

export function UpdateNotification() {
   const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
   const [isVisible, setIsVisible] = useState(false)
   const [progress, setProgress] = useState(0)

   useEffect(() => {
      // Check if the API methods exist before using them
      if (!window.api?.onUpdateEvent) {
         console.warn('Update API not available')
         return
      }

      const handleUpdateEvent = (info: UpdateInfo) => {
         console.log('Update event:', info)

         switch (info.event) {
            case 'checking-for-update':
               toast.info('Checking for updates...')
               break

            case 'update-available':
               setUpdateInfo(info)
               setIsVisible(true)
               toast.success(`New version ${info.data.version} available!`)
               break

            case 'update-not-available':
               toast.info('You have the latest version')
               break

            case 'download-progress':
               setProgress(info.data.percent)
               setUpdateInfo(prev => ({
                  ...prev!,
                  event: 'downloading',
                  data: info.data
               }))
               break

            case 'update-downloaded':
               setUpdateInfo({
                  event: 'update-downloaded',
                  data: info.data
               })
               toast.success('Update downloaded! Ready to install.')
               break

            case 'update-error':
               toast.error(`Update error: ${info.data}`)
               setIsVisible(false)
               break
         }
      }

      window.api.onUpdateEvent(handleUpdateEvent)

      return () => {
         if (window.api?.removeUpdateListeners) {
            window.api.removeUpdateListeners()
         }
      }
   }, [])

   if (!isVisible || !updateInfo) return null

   const getIcon = () => {
      switch (updateInfo.event) {
         case 'update-available':
            return <Download className="w-5 h-5" />
         case 'downloading':
            return <RefreshCw className="w-5 h-5 animate-spin" />
         case 'update-downloaded':
            return <CheckCircle className="w-5 h-5" />
         default:
            return <AlertCircle className="w-5 h-5" />
      }
   }

   const getMessage = () => {
      switch (updateInfo.event) {
         case 'update-available':
            return `Version ${updateInfo.data.version} is available`
         case 'downloading':
            return `Downloading update: ${Math.round(progress)}%`
         case 'update-downloaded':
            return `Update ready to install (v${updateInfo.data.version})`
         default:
            return 'Update status'
      }
   }

   const handleDownload = () => {
      if (window.api?.downloadUpdate) {
         window.api.downloadUpdate()
      }
   }

   const handleQuitAndInstall = () => {
      if (window.api?.quitAndInstall) {
         window.api.quitAndInstall()
      }
   }

   return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg animate-in slide-in-from-top duration-300">
         <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  {getIcon()}
                  <span className="font-medium">{getMessage()}</span>
               </div>

               <div className="flex items-center gap-2">
                  {updateInfo.event === 'update-available' && (
                     <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleDownload}
                     >
                        Download Now
                     </Button>
                  )}

                  {updateInfo.event === 'update-downloaded' && (
                     <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleQuitAndInstall}
                     >
                        Restart & Install
                     </Button>
                  )}

                  <Button
                     size="sm"
                     variant="ghost"
                     className="text-white hover:bg-white/20"
                     onClick={() => setIsVisible(false)}
                  >
                     <X className="w-4 h-4" />
                  </Button>
               </div>
            </div>

            {updateInfo.event === 'downloading' && (
               <Progress value={progress} className="mt-2 h-1 bg-white/20" />
            )}
         </div>
      </div>
   )
}