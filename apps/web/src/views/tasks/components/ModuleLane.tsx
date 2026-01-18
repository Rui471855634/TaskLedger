import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import type { TaskId, WorkModule, WorkTask } from '../../../storage/db'
import { containerId } from '../../../storage/ops'
import { TaskCard } from './TaskCard'
import styles from './ModuleLane.module.css'

export function ModuleLane(props: {
  module: WorkModule
  todo: WorkTask[]
  done: WorkTask[]
  isDoneExpanded: boolean
  doneDroppableEnabled: boolean
  onToggleDoneExpanded: () => void
  onAddTask: () => void
  onEditModule: () => void
  onToggleTask: (taskId: TaskId, completed: boolean) => void
  onOpenTask: (taskId: TaskId) => void
  dragId: string
  taskDragId: (taskId: TaskId) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.dragId,
    data: { type: 'module', moduleId: props.module.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const todoContainerId = containerId('todo', props.module.id)
  const doneContainerId = containerId('done', props.module.id)

  const todoIds = useMemo(() => props.todo.map((t) => props.taskDragId(t.id)), [props.todo, props.taskDragId])
  const doneIds = useMemo(() => props.done.map((t) => props.taskDragId(t.id)), [props.done, props.taskDragId])

  const todoDrop = useDroppable({ id: todoContainerId })
  const doneDrop = useDroppable({ id: doneContainerId, disabled: !props.doneDroppableEnabled })

  const doneCount = props.done.length

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={clsx(styles.lane, isDragging && styles.dragging)}
    >
      <header
        className={styles.header}
        style={{ background: `linear-gradient(180deg, ${props.module.color}33, transparent)` }}
      >
        <div className={styles.headerLeft}>
          <div className={styles.dragHandle} {...attributes} {...listeners} title="拖拽模块排序">
            ⋮⋮
          </div>
          <div className={styles.moduleName}>{props.module.name}</div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.btn} type="button" onClick={props.onEditModule}>
            编辑
          </button>
          <button className={styles.primaryBtn} type="button" onClick={props.onAddTask}>
            + 子任务
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <div ref={todoDrop.setNodeRef} className={clsx(styles.section, todoDrop.isOver && styles.over)}>
          <div className={styles.sectionTitle}>待完成</div>
          <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
            <div className={styles.list}>
              {props.todo.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  moduleId={props.module.id}
                  moduleColor={props.module.color}
                  dragId={props.taskDragId(t.id)}
                  onToggle={(c) => props.onToggleTask(t.id, c)}
                  onOpen={() => props.onOpenTask(t.id)}
                />
              ))}
              {props.todo.length === 0 && <div className={styles.empty}>暂无待完成任务</div>}
            </div>
          </SortableContext>
        </div>

        <div className={styles.doneBlock}>
          <button className={styles.doneToggle} type="button" onClick={props.onToggleDoneExpanded}>
            <span>已完成</span>
            <span className={styles.doneMeta}>
              {doneCount} {props.isDoneExpanded ? '▾' : '▸'}
            </span>
          </button>

          {props.isDoneExpanded ? (
            <div ref={doneDrop.setNodeRef} className={clsx(styles.section, doneDrop.isOver && styles.over)}>
              <SortableContext items={doneIds} strategy={verticalListSortingStrategy}>
                <div className={styles.list}>
                  {props.done.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      moduleId={props.module.id}
                      moduleColor={props.module.color}
                      dragId={props.taskDragId(t.id)}
                      onToggle={(c) => props.onToggleTask(t.id, c)}
                      onOpen={() => props.onOpenTask(t.id)}
                      completed
                    />
                  ))}
                  {props.done.length === 0 && <div className={styles.empty}>暂无已完成任务</div>}
                </div>
              </SortableContext>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

