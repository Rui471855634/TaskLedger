import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { IndexedDbUnsupportedModal } from './components/IndexedDbUnsupportedModal'
import { ToastProvider } from '../components/Toast'
import { initDbOrThrow, isIndexedDbSupported } from '../storage/db'
import { ensureAtLeastOneModule } from '../storage/ops'
import { TasksPage } from '../views/tasks/TasksPage'
import { SummaryPage } from '../views/summary/SummaryPage'

export function RootApp() {
  const [indexedDbOk, setIndexedDbOk] = useState(true)
  const [fatalMessage, setFatalMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isIndexedDbSupported()) {
      setIndexedDbOk(false)
      return
    }
    try {
      initDbOrThrow()
      void ensureAtLeastOneModule()
    } catch (e) {
      setFatalMessage(e instanceof Error ? e.message : String(e))
      setIndexedDbOk(false)
    }
  }, [])

  const blocker = useMemo(() => {
    if (indexedDbOk) return null
    return (
      <IndexedDbUnsupportedModal
        message={fatalMessage ?? '当前浏览器不支持 IndexedDB，请更换浏览器后重试。'}
      />
    )
  }, [fatalMessage, indexedDbOk])

  if (blocker) return blocker

  return (
    <ToastProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/" element={<Navigate to="/tasks" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
