import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DndContext, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { db, type ModuleId, type TaskId, type WorkTask } from '../../storage/db'
import {
  containerId,
  moveAndReorderTask,
  reorderModules,
  setTaskCompletion,
} from '../../storage/ops'
import styles from './TasksPage.module.css'
import { ModuleLane } from './components/ModuleLane'
import { TaskDrawer } from './components/TaskDrawer'
import { ModuleModal } from './components/ModuleModal'
import { randomModuleColor } from '../../utils/colors'

type DragId = string

function modDragId(id: ModuleId): DragId {
  return `module:${id}`
}
function taskDragId(id: TaskId): DragId {
  return `task:${id}`
}
function parseDragId(id: DragId): { type: 'module' | 'task'; id: string } | null {
  const [type, rest] = id.split(':')
  if (!rest) return null
  if (type === 'module') return { type: 'module', id: rest }
  if (type === 'task') return { type: 'task', id: rest }
  return null
}

export function TasksPage() {
  const modules = useLiveQuery(async () => db().modules.orderBy('order').toArray(), [], [])
  const tasks = useLiveQuery(async () => db().tasks.toArray(), [], [])
  const [expandedDone, setExpandedDone] = useState<Record<ModuleId, boolean>>({})
  const [taskEditor, setTaskEditor] = useState<
    | { mode: 'create'; moduleId: ModuleId }
    | { mode: 'edit'; taskId: TaskId }
    | null
  >(null)
  const [moduleEditor, setModuleEditor] = useState<
    | { mode: 'create'; initialColor: string }
    | { mode: 'edit'; moduleId: ModuleId }
    | null
  >(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const modulesById = useMemo(() => new Map((modules ?? []).map((m) => [m.id, m])), [modules])
  const tasksById = useMemo(() => new Map((tasks ?? []).map((t) => [t.id, t])), [tasks])

  const laneModel = useMemo(() => {
    const mods = modules ?? []
    const all = tasks ?? []
    const byModule: Record<ModuleId, { todo: WorkTask[]; done: WorkTask[] }> = {}
    for (const m of mods) byModule[m.id] = { todo: [], done: [] }
    for (const t of all) {
      if (!byModule[t.moduleId]) continue
      if (t.completedAt == null) byModule[t.moduleId].todo.push(t)
      else byModule[t.moduleId].done.push(t)
    }
    for (const m of mods) {
      byModule[m.id].todo.sort((a, b) => a.order - b.order)
      byModule[m.id].done.sort((a, b) => a.order - b.order)
    }
    return { mods, byModule }
  }, [modules, tasks])

  const moduleDragIds = useMemo(() => laneModel.mods.map((m) => modDragId(m.id)), [laneModel.mods])

  function handleAddModule() {
    setModuleEditor({ mode: 'create', initialColor: randomModuleColor() })
  }

  function handleAddTask(moduleId: ModuleId) {
    setTaskEditor({ mode: 'create', moduleId })
  }

  async function handleToggleTask(taskId: TaskId, completed: boolean) {
    await setTaskCompletion(taskId, completed)
    if (completed) setExpandedDone((m) => ({ ...m, [tasksById.get(taskId)?.moduleId ?? '']: false }))
  }

  function isDoneExpanded(moduleId: ModuleId) {
    return Boolean(expandedDone[moduleId])
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.title}>任务</div>
        <button className={styles.primaryBtn} onClick={handleAddModule} type="button">
          新建模块
        </button>
      </div>

      <div className={styles.boardViewport}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={async ({ active, over }) => {
            if (!over) return
            const a = parseDragId(String(active.id))
            const o = parseDragId(String(over.id))

            // Module reorder
            if (a?.type === 'module' && o?.type === 'module' && modules) {
              const fromIdx = modules.findIndex((m) => m.id === a.id)
              const toIdx = modules.findIndex((m) => m.id === o.id)
              if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return
              const moved = arrayMove(modules, fromIdx, toIdx).map((m) => m.id)
              await reorderModules(moved)
              return
            }

            // Task reorder / move
            if (a?.type === 'task' && tasks) {
              const activeTask = tasksById.get(a.id)
              if (!activeTask) return

              const overId = String(over.id)
              const overParsed = parseDragId(overId)
              const overTask = overParsed?.type === 'task' ? tasksById.get(overParsed.id) : null

              const fromContainer = containerId(
                activeTask.completedAt == null ? 'todo' : 'done',
                activeTask.moduleId,
              )

              let toContainer = fromContainer
              if (overTask) {
                toContainer = containerId(overTask.completedAt == null ? 'todo' : 'done', overTask.moduleId)
              } else if (overId.startsWith('todo:') || overId.startsWith('done:')) {
                toContainer = overId as any
              }

              const [toKind, toModuleId] = toContainer.split(':') as ['todo' | 'done', ModuleId]
              if (toKind === 'done' && !isDoneExpanded(toModuleId)) return

              const toList = (laneModel.byModule[toModuleId]?.[toKind] ?? []).map((x) => x.id)
              const fromKind = fromContainer.split(':')[0] as 'todo' | 'done'
              const fromList = (laneModel.byModule[activeTask.moduleId]?.[fromKind] ?? []).map((x) => x.id)

              const overIndex = overTask ? toList.indexOf(overTask.id) : toList.length
              const nextTo = toList.filter((id) => id !== activeTask.id)
              nextTo.splice(Math.max(0, overIndex), 0, activeTask.id)

              if (fromContainer === toContainer) {
                await moveAndReorderTask({
                  taskId: activeTask.id,
                  from: fromContainer,
                  to: toContainer,
                  orderedTaskIdsInTo: nextTo,
                })
                return
              }

              const nextFrom = fromList.filter((id) => id !== activeTask.id)
              await moveAndReorderTask({
                taskId: activeTask.id,
                from: fromContainer,
                to: toContainer,
                orderedTaskIdsInTo: nextTo,
                orderedTaskIdsInFrom: nextFrom,
              })
            }
          }}
        >
          <SortableContext items={moduleDragIds} strategy={horizontalListSortingStrategy}>
            <div className={styles.board}>
              {laneModel.mods.map((m) => (
                <ModuleLane
                  key={m.id}
                  module={m}
                  todo={laneModel.byModule[m.id]?.todo ?? []}
                  done={laneModel.byModule[m.id]?.done ?? []}
                  isDoneExpanded={isDoneExpanded(m.id)}
                  onToggleDoneExpanded={() =>
                    setExpandedDone((x) => ({ ...x, [m.id]: !Boolean(x[m.id]) }))
                  }
                  onAddTask={() => void handleAddTask(m.id)}
                  onEditModule={() => setModuleEditor({ mode: 'edit', moduleId: m.id })}
                  onToggleTask={(taskId, completed) => void handleToggleTask(taskId, completed)}
                  onOpenTask={(taskId) => setTaskEditor({ mode: 'edit', taskId })}
                  dragId={modDragId(m.id)}
                  taskDragId={taskDragId}
                  doneDroppableEnabled={isDoneExpanded(m.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <TaskDrawer
        open={Boolean(taskEditor)}
        mode={taskEditor?.mode ?? 'edit'}
        task={taskEditor?.mode === 'edit' ? tasksById.get(taskEditor.taskId) ?? null : null}
        module={
          taskEditor?.mode === 'create'
            ? modulesById.get(taskEditor.moduleId) ?? null
            : modulesById.get(tasksById.get(taskEditor?.taskId ?? '')?.moduleId ?? '') ?? null
        }
        moduleId={taskEditor?.mode === 'create' ? taskEditor.moduleId : null}
        onClose={() => setTaskEditor(null)}
        onSaved={(createdTaskId) => {
          if (createdTaskId) setTaskEditor({ mode: 'edit', taskId: createdTaskId })
        }}
      />

      <ModuleModal
        open={Boolean(moduleEditor)}
        mode={moduleEditor?.mode ?? 'edit'}
        initialColor={moduleEditor?.mode === 'create' ? moduleEditor.initialColor : null}
        module={moduleEditor?.mode === 'edit' ? modulesById.get(moduleEditor.moduleId) ?? null : null}
        onClose={() => setModuleEditor(null)}
      />
    </div>
  )
}

