import React, { useState, useEffect } from 'react'
import { Button } from './components/ui/button'
import { UpdateNotification } from './components/UpdateNotification/UpdateNotification'
import { ToastProvider } from './components/ui/toast'

function App(): React.JSX.Element {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    // Get app version on mount - with error handling
    if (window.api?.getVersion) {
      window.api.getVersion().then(setVersion).catch(console.error)
    }
  }, [])

  const handleCheckUpdate = (): void => {
    if (window.api?.checkForUpdates) {
      window.api.checkForUpdates()
    } else {
      console.warn('Update API not available')
    }
  }

  return (
    <ToastProvider>
      <UpdateNotification />
      <div className="your-existing-content">
        {/* Add version display and update check button somewhere */}
        <div className="p-4">
          <p className="text-sm text-gray-500">Version: {version || 'Unknown'}</p>
          <Button onClick={handleCheckUpdate} size="sm" variant="outline">
            Check for Updates
          </Button>
        </div>

        {/* Rest of your app... */}
      </div>
    </ToastProvider>
  )
}

export default App