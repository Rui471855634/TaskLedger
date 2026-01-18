import { useEffect, useMemo, useState } from 'react'
import type { ModuleId, WorkModule, WorkTask } from '../../../storage/db'
import { createTask, updateTask } from '../../../storage/ops'
import styles from './TaskDrawer.module.css'

export function TaskDrawer(props: {
  open: boolean
  mode: 'create' | 'edit'
  task: WorkTask | null
  module: WorkModule | null
  moduleId: ModuleId | null
  onClose: () => void
  onSaved?: (createdTaskId: string | null) => void
}) {
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!props.open) return
    setError(null)
    if (props.mode === 'edit') {
      setTitle(props.task?.title ?? '')
      setDetail(props.task?.detail ?? '')
    } else {
      setTitle('')
      setDetail('')
    }
  }, [props.mode, props.open, props.task?.detail, props.task?.id, props.task?.title])

  const header = useMemo(() => {
    if (!props.module) return null
    return (
      <div className={styles.drawerHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.badge} style={{ background: props.module.color }} />
          <div className={styles.headerText}>
            <div className={styles.headerTitle}>{props.mode === 'create' ? '新建子任务' : '编辑子任务'}</div>
            <div className={styles.headerSub}>{props.module.name}</div>
          </div>
        </div>
        <button className={styles.closeBtn} type="button" onClick={props.onClose} disabled={saving}>
          关闭
        </button>
      </div>
    )
  }, [props.module, props.mode, props.onClose, saving])

  const canShow = props.open && (props.mode === 'create' ? Boolean(props.moduleId && props.module) : Boolean(props.task && props.module))
  if (!canShow) return null

  const trimmedTitle = title.trim()
  const canSave = Boolean(trimmedTitle) && !saving

  async function save() {
    setError(null)
    if (!trimmedTitle) {
      setError('任务名称不能为空')
      return
    }
    setSaving(true)
    try {
      if (props.mode === 'create') {
        const mid = props.moduleId
        if (!mid) throw new Error('缺少 moduleId')
        const created = await createTask(mid, { title: trimmedTitle, detail })
        props.onSaved?.(created.id)
      } else {
        if (!props.task) throw new Error('缺少 task')
        await updateTask(props.task.id, { title: trimmedTitle, detail })
        props.onSaved?.(null)
      }
      props.onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.backdrop} onClick={props.onClose} role="presentation">
      <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {header}

        <div className={styles.form}>
          {error ? <div className={styles.error}>{error}</div> : null}
          <label className={styles.label}>
            <div className={styles.labelText}>任务名称</div>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：开会"
            />
          </label>

          <label className={styles.label}>
            <div className={styles.labelText}>任务详情</div>
            <textarea
              className={styles.textarea}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="写一些补充说明…"
              rows={10}
            />
          </label>
        </div>

        <div className={styles.footer}>
          <button className={styles.ghostBtn} type="button" onClick={props.onClose} disabled={saving}>
            取消
          </button>
          <button className={styles.primaryBtn} type="button" onClick={() => void save()} disabled={!canSave}>
            保存
          </button>
        </div>
      </aside>
    </div>
  )
}

