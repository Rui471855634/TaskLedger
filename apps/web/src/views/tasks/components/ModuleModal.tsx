import { useEffect, useState } from 'react'
import type { WorkModule } from '../../../storage/db'
import { createModule, updateModule } from '../../../storage/ops'
import { MACARON_COLORS, randomModuleColor } from '../../../utils/colors'
import styles from './ModuleModal.module.css'

export function ModuleModal(props: {
  open: boolean
  mode: 'create' | 'edit'
  initialColor: string | null
  module: WorkModule | null
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!props.open) return
    setError(null)
    if (props.mode === 'edit') {
      setName(props.module?.name ?? '')
      setColor(props.module?.color ?? randomModuleColor())
      return
    }
    setName('')
    setColor(props.initialColor ?? randomModuleColor())
  }, [props.initialColor, props.mode, props.module?.color, props.module?.id, props.module?.name, props.open])

  const title = props.mode === 'create' ? '新建模块' : '编辑模块'
  const trimmedName = name.trim()
  const canSave = Boolean(trimmedName) && !saving
  const palette = MACARON_COLORS

  async function save() {
    setError(null)
    if (!trimmedName) {
      setError('模块名称不能为空')
      return
    }
    setSaving(true)
    try {
      if (props.mode === 'create') {
        await createModule({ name: trimmedName, color })
      } else {
        await updateModule(props.module!.id, { name: trimmedName, color })
      }
      props.onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const canShow = props.open && (props.mode === 'create' || Boolean(props.module))
  if (!canShow) return null

  return (
    <div className={styles.backdrop} onClick={props.onClose} role="presentation">
      <div className={styles.card} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button className={styles.closeBtn} type="button" onClick={props.onClose} disabled={saving}>
            关闭
          </button>
        </div>

        <div className={styles.form}>
          {error ? <div className={styles.error}>{error}</div> : null}
          <label className={styles.label}>
            <div className={styles.labelText}>模块名称</div>
            <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className={styles.label}>
            <div className={styles.labelText}>背景色</div>
            <div className={styles.paletteRow}>
              {palette.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={styles.swatch}
                  style={{ background: c, ['--swatch' as any]: c }}
                  aria-label={`选择颜色 ${c}`}
                  onClick={() => setColor(c)}
                  data-selected={c === color ? 'true' : 'false'}
                  aria-pressed={c === color}
                />
              ))}
              <button className={styles.btn} type="button" onClick={() => setColor(randomModuleColor())}>
                随机
              </button>
            </div>
            <div className={styles.previewRow}>
              <div className={styles.previewLabel}>当前颜色</div>
              <div className={styles.previewChip} style={{ background: color }} />
            </div>
          </label>
        </div>

        <div className={styles.footer}>
          <button className={styles.btn} type="button" onClick={props.onClose} disabled={saving}>
            取消
          </button>
          <button
            className={styles.primaryBtn}
            type="button"
            onClick={() => void save()}
            disabled={!canSave}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

