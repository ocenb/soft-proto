import React, { useState, useEffect } from 'react'

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    // Initial online status check
    const initialOnline = navigator.onLine
    if (!initialOnline) {
      addToast('offline', 'Вы в офлайне', true)
    }

    const handleOnline = () => {
      // Remove any persistent 'offline' toast
      setToasts((prev) => prev.filter((t) => t.id !== 'offline-persistent'))
      // Add 'online restored' toast
      addToast('online', 'Соединение восстановлено', false, 3000)
    }

    const handleOffline = () => {
      addToast('offline', 'Вы в офлайне', true)
    }

    const handleOfflineAttempt = () => {
      addToast('offline-attempt', 'Вы находитесь в офлайн-режиме', false, 4000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('app-offline-request-attempted', handleOfflineAttempt)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('app-offline-request-attempted', handleOfflineAttempt)
    }
  }, [])

  const addToast = (type, message, persistent = false, duration = 3000) => {
    const id = persistent ? `${type}-persistent` : `${type}-${Date.now()}-${Math.random()}`

    setToasts((prev) => {
      // Ensure no duplicate persistent toasts
      if (persistent && prev.some((t) => t.id === id)) {
        return prev
      }
      return [...prev, { id, type, message }]
    })

    if (!persistent) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="toast-container" aria-live="assertive">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'online' && '🟢'}
            {toast.type === 'offline' && '🔴'}
            {toast.type === 'offline-attempt' && '⚠️'}
          </span>
          <span className="toast-message">{toast.message}</span>
          {!toast.id.endsWith('-persistent') && (
            <button onClick={() => removeToast(toast.id)} className="toast-close-btn" aria-label="Close">
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
