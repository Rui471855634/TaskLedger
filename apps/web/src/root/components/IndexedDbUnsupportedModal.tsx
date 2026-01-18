import { useEffect, useState } from 'react'
import styles from './IndexedDbUnsupportedModal.module.css'

export function IndexedDbUnsupportedModal({ message }: { message: string }) {
  const [secondsLeft, setSecondsLeft] = useState(5)

  useEffect(() => {
    const t = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (secondsLeft !== 0) return
    try {
      window.close()
    } catch {
      // ignore
    }
  }, [secondsLeft])

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <div className={styles.title}>无法继续</div>
        <div className={styles.msg}>{message}</div>
        <div className={styles.hint}>
          将在 {secondsLeft}s 后尝试自动关闭页面（若浏览器阻止，请手动关闭）。
        </div>
      </div>
    </div>
  )
}

