import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './Toast.module.css'

interface Toast {
  id: string
  message: string
}

interface ToastContextType {
  show: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idCounter = useRef(0)

  const show = useCallback((message: string) => {
    const id = `toast-${++idCounter.current}`
    setToasts((prev) => [...prev, { id, message }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className={styles.container}>
          {toasts.map((t) => (
            <div key={t.id} className={styles.toast}>
              {t.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}
