import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { db, type TaskId, type WorkModule, type WorkTask } from '../../storage/db'
import { TaskDrawer } from '../tasks/components/TaskDrawer'
import styles from './SummaryPage.module.css'

type ViewMode = 'day' | 'week' | 'month'
type ItemMode = 'completed' | 'created_uncompleted'

const START = new Date(2026, 0, 1)
const WEEK_STARTS_ON: 0 | 1 = 1

type Period = {
  key: string
  label: string
  start: Date
  endExclusive: Date
}

function buildPeriods(mode: ViewMode, count: number): Period[] {
  const base = START
  const res: Period[] = []

  if (mode === 'day') mode = 'month'

  if (mode === 'week') {
    // week starts Monday
    const wk0 = startOfWeek(base, { weekStartsOn: WEEK_STARTS_ON })
    for (let i = 0; i < count; i++) {
      const start = addWeeks(wk0, i)
      const endInclusive = endOfWeek(start, { weekStartsOn: WEEK_STARTS_ON })
      const endExclusive = addDays(endInclusive, 1)
      res.push({
        key: `${format(start, 'yyyy')}-W${format(start, 'II')}`,
        label: `${format(start, 'yyyy-MM-dd')} ~ ${format(endInclusive, 'yyyy-MM-dd')}`,
        start,
        endExclusive,
      })
    }
    return res
  }

  const m0 = startOfMonth(base)
  for (let i = 0; i < count; i++) {
    const start = addMonths(m0, i)
    const endInclusive = endOfMonth(start)
    const endExclusive = addDays(endInclusive, 1)
    res.push({
      key: format(start, 'yyyy-MM'),
      label: format(start, 'yyyy年MM月'),
      start,
      endExclusive,
    })
  }
  return res
}

function inPeriod(ts: number, p: Period) {
  const t = new Date(ts)
  return t >= p.start && t < p.endExclusive
}

export function SummaryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [itemMode, setItemMode] = useState<ItemMode>('completed')
  const [periodCount, setPeriodCount] = useState(12)
  const [selectedTaskId, setSelectedTaskId] = useState<TaskId | null>(null)

  const modules = useLiveQuery(async () => db().modules.orderBy('order').toArray(), [], [])
  const tasks = useLiveQuery(async () => db().tasks.toArray(), [], [])

  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // reset list size when switching view modes
    setPeriodCount(viewMode === 'week' ? 16 : 12)
  }, [viewMode])

  const moduleById = useMemo(() => new Map((modules ?? []).map((m) => [m.id, m])), [modules])
  const taskById = useMemo(() => new Map((tasks ?? []).map((t) => [t.id, t])), [tasks])

  const periods = useMemo(() => buildPeriods(viewMode, periodCount), [periodCount, viewMode])

  const itemsByPeriodKey = useMemo(() => {
    const all = tasks ?? []
    const res: Record<string, WorkTask[]> = {}
    for (const p of periods) res[p.key] = []

    for (const t of all) {
      const include =
        itemMode === 'completed'
          ? t.completedAt != null
          : t.completedAt == null && t.createdAt != null
      if (!include) continue

      const ts = itemMode === 'completed' ? t.completedAt! : t.createdAt
      for (const p of periods) {
        if (inPeriod(ts, p)) {
          res[p.key].push(t)
          break
        }
      }
    }

    for (const p of periods) {
      res[p.key].sort((a, b) => {
        const ta = itemMode === 'completed' ? a.completedAt! : a.createdAt
        const tb = itemMode === 'completed' ? b.completedAt! : b.createdAt
        return tb - ta
      })
    }

    return res
  }, [itemMode, periods, tasks])

  function labelForModule(m: WorkModule | undefined) {
    return m?.name ?? '未知模块'
  }

  const today = new Date()

  const itemsByDayKey = useMemo(() => {
    const all = tasks ?? []
    const res: Record<string, WorkTask[]> = {}
    for (const t of all) {
      const include =
        itemMode === 'completed'
          ? t.completedAt != null
          : t.completedAt == null && t.createdAt != null
      if (!include) continue
      const ts = itemMode === 'completed' ? t.completedAt! : t.createdAt
      const k = format(new Date(ts), 'yyyy-MM-dd')
      if (!res[k]) res[k] = []
      res[k].push(t)
    }
    for (const k of Object.keys(res)) {
      res[k].sort((a, b) => {
        const ta = itemMode === 'completed' ? a.completedAt! : a.createdAt
        const tb = itemMode === 'completed' ? b.completedAt! : b.createdAt
        return tb - ta
      })
    }
    return res
  }, [itemMode, tasks])

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.left}>
          <div className={styles.title}>汇总</div>
          <div className={styles.subtitle}>从 2026-01 起向后无限滚动</div>
        </div>

        <div className={styles.controls}>
          <div className={styles.group}>
            <button
              type="button"
              className={viewMode === 'day' ? styles.active : styles.btn}
              onClick={() => setViewMode('day')}
            >
              日
            </button>
            <button
              type="button"
              className={viewMode === 'week' ? styles.active : styles.btn}
              onClick={() => setViewMode('week')}
            >
              周
            </button>
            <button
              type="button"
              className={viewMode === 'month' ? styles.active : styles.btn}
              onClick={() => setViewMode('month')}
            >
              月
            </button>
          </div>

          <div className={styles.group}>
            <button
              type="button"
              className={itemMode === 'completed' ? styles.active : styles.btn}
              onClick={() => setItemMode('completed')}
            >
              已完成
            </button>
            <button
              type="button"
              className={itemMode === 'created_uncompleted' ? styles.active : styles.btn}
              onClick={() => setItemMode('created_uncompleted')}
            >
              未完成
            </button>
          </div>
        </div>
      </div>

      <div
        className={styles.scroller}
        ref={scrollerRef}
        onScroll={(e) => {
          const el = e.currentTarget
          const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 320
          if (nearBottom) setPeriodCount((c) => c + (viewMode === 'week' ? 6 : 2))
        }}
      >
        {viewMode === 'day'
          ? periods.map((m) => {
              const monthStart = startOfMonth(m.start)
              const gridStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON })
              const monthEnd = endOfMonth(m.start)
              const gridEndInclusive = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON })
              const days: Date[] = []
              for (let d = gridStart; d <= gridEndInclusive; d = addDays(d, 1)) {
                days.push(d)
              }

              const monthCount = days.reduce((acc, d) => {
                const k = format(d, 'yyyy-MM-dd')
                return acc + (itemsByDayKey[k]?.length ?? 0)
              }, 0)

              return (
                <section key={m.key} className={styles.period}>
                  <div className={styles.periodHeader}>
                    <div className={styles.periodLabel}>{m.label}</div>
                    <div className={styles.periodMeta}>{monthCount} 条</div>
                  </div>

                  <div className={styles.calendarHeader}>
                    {['一', '二', '三', '四', '五', '六', '日'].map((x) => (
                      <div key={x} className={styles.calendarDow}>
                        {x}
                      </div>
                    ))}
                  </div>

                  <div className={styles.calendarGrid}>
                    {days.map((d) => {
                      const inThisMonth = isSameMonth(d, monthStart)
                      const isBeforeStart = d < START
                      const disabled = !inThisMonth || isBeforeStart
                      const isToday = isSameDay(d, today)
                      const key = format(d, 'yyyy-MM-dd')
                      const list = disabled ? [] : itemsByDayKey[key] ?? []
                      return (
                        <div
                          key={key}
                          className={[
                            styles.dayCell,
                            disabled ? styles.dayCellDisabled : '',
                            isToday ? styles.dayCellToday : '',
                          ].join(' ')}
                        >
                          <div className={styles.dayHeader}>
                            <div className={styles.dayNum}>{format(d, 'd')}</div>
                            {isToday ? <div className={styles.todayBadge}>今天</div> : null}
                          </div>
                          <div className={styles.dayItems}>
                            {list.slice(0, 4).map((t) => {
                              const mod = moduleById.get(t.moduleId)
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  className={styles.pill}
                                  style={{
                                    background: `${mod?.color ?? '#334155'}2b`,
                                    borderColor: `${mod?.color ?? '#334155'}66`,
                                  }}
                                  title={t.detail || undefined}
                                  onClick={() => setSelectedTaskId(t.id)}
                                >
                                  <span className={styles.pillTitle}>{t.title || '（未命名）'}</span>
                                  <span className={styles.pillModule}>{labelForModule(mod)}</span>
                                </button>
                              )
                            })}
                            {list.length > 4 ? (
                              <div className={styles.moreHint}>+{list.length - 4} 更多</div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })
          : periods.map((p) => (
              <section key={p.key} className={styles.period}>
                <div className={styles.periodHeader}>
                  <div className={styles.periodLabel}>{p.label}</div>
                  <div className={styles.periodMeta}>{itemsByPeriodKey[p.key]?.length ?? 0} 条</div>
                </div>

                <div className={styles.items}>
                  {(itemsByPeriodKey[p.key] ?? []).map((t) => {
                    const mod = moduleById.get(t.moduleId)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={styles.item}
                        style={{
                          background: `${mod?.color ?? '#334155'}22`,
                          borderColor: `${mod?.color ?? '#334155'}55`,
                        }}
                        title={t.detail || undefined}
                        onClick={() => setSelectedTaskId(t.id)}
                      >
                        <div className={styles.itemLeft}>{t.title || '（未命名）'}</div>
                        <div className={styles.itemRight}>{labelForModule(mod)}</div>
                      </button>
                    )
                  })}

                  {(itemsByPeriodKey[p.key] ?? []).length === 0 ? (
                    <div className={styles.empty}>暂无记录</div>
                  ) : null}
                </div>
              </section>
            ))}

        <div className={styles.footerHint}>继续下滑加载更多…</div>
      </div>

      <TaskDrawer
        open={Boolean(selectedTaskId)}
        mode="edit"
        task={selectedTaskId ? taskById.get(selectedTaskId) ?? null : null}
        module={
          selectedTaskId
            ? moduleById.get(taskById.get(selectedTaskId)?.moduleId ?? '') ?? null
            : null
        }
        moduleId={null}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  )
}

