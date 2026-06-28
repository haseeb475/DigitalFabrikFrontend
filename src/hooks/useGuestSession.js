import { useCallback, useState } from 'react'
import { apiService } from '../services/mockApi'

export function useGuestSession() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)

  const initialize = useCallback(async (options) => {
    setError(null)
    try {
      await apiService.initializeGuestSession(options)
      setIsReady(true)
      return true
    } catch (err) {
      setError(err.message ?? 'Failed to initialize session')
      return false
    }
  }, [])

  return { isReady, error, initialize }
}
