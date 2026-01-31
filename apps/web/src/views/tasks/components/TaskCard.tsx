import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import type { ModuleId, WorkTask } from '../../../storage/db'
import styles from './TaskCard.module.css'

export function TaskCard(props: {
  task: WorkTask
  moduleId: ModuleId
  moduleColor: string
  dragId: string
  completed?: boolean
  onToggle: (completed: boolean) => void
  onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.dragId,
    data: { type: 'task', taskId: props.task.id, moduleId: props.moduleId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    '--card-color': props.moduleColor,
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(styles.card, isDragging && styles.dragging, props.completed && styles.completed)}
      onClick={props.onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') props.onOpen()
      }}
    >
      <div className={styles.topRow}>
        <button
          className={styles.check}
          type="button"
          aria-label={props.completed ? '标记为未完成' : '标记为已完成'}
          onClick={(e) => {
            e.stopPropagation()
            props.onToggle(!props.completed)
          }}
        >
          <span className={clsx(styles.dot, props.completed && styles.dotOn)} />
        </button>

        <div className={styles.title}>{props.task.title || '（未命名）'}</div>

        <div className={styles.drag} {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
          ⋮⋮
        </div>
      </div>

      {props.task.detail ? <div className={styles.detail}>{props.task.detail}</div> : null}
    </div>
  )
}

