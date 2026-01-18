import { db, type ModuleId, type TaskId, type WorkModule, type WorkTask } from './db'
import { randomModuleColor } from '../utils/colors'
import { newId } from '../utils/id'

function now() {
  return Date.now()
}

export async function ensureAtLeastOneModule() {
  // IMPORTANT: In React dev StrictMode, effects can run twice.
  // Use a write transaction so concurrent calls don't create duplicates.
  await db().transaction('rw', db().modules, db().tasks, async () => {
    const moduleCount = await db().modules.count()
    if (moduleCount === 0) {
      const t = now()
      const mod: WorkModule = {
        id: newId('mod'),
        // system default module (only created when database is empty)
        name: '默认模块',
        color: randomModuleColor(),
        order: 0,
        createdAt: t,
        updatedAt: t,
      }
      await db().modules.add(mod)
      return
    }

    // Cleanup: if there are NO tasks and modules are all system defaults,
    // dedupe them down to a single default module.
    const taskCount = await db().tasks.count()
    if (taskCount !== 0) return

    const mods = await db().modules.toArray()
    const isSystemDefaultName = (name: string) => /^默认模块(\s*\d+)?$/.test(name.trim())
    if (!mods.every((m) => isSystemDefaultName(m.name))) return
    if (mods.length <= 1) return

    const sorted = mods
      .slice()
      .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    const keep = sorted[0]!
    const toDelete = sorted.slice(1).map((m) => m.id)
    await db().modules.bulkDelete(toDelete)
    await db().modules.update(keep.id, { order: 0, updatedAt: now() })
  })
}

export async function createModule(input?: Partial<Pick<WorkModule, 'name' | 'color'>>) {
  const t = now()
  const maxOrder = (await db().modules.orderBy('order').last())?.order ?? -1
  const name = input?.name?.trim() ?? ''
  if (!name) throw new Error('模块名称不能为空')
  const mod: WorkModule = {
    id: newId('mod'),
    name,
    color: input?.color || randomModuleColor(),
    order: maxOrder + 1,
    createdAt: t,
    updatedAt: t,
  }
  await db().modules.add(mod)
  return mod
}

export async function updateModule(moduleId: ModuleId, patch: Partial<Pick<WorkModule, 'name' | 'color'>>) {
  if (patch.name !== undefined && !patch.name.trim()) throw new Error('模块名称不能为空')
  await db()
    .modules.update(moduleId, {
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      updatedAt: now(),
    })
}

export async function deleteModule(moduleId: ModuleId) {
  await db().transaction('rw', db().modules, db().tasks, async () => {
    await db().modules.delete(moduleId)
    await db().tasks.where({ moduleId }).delete()
    await ensureAtLeastOneModule()
  })
}

export async function reorderModules(orderedModuleIds: ModuleId[]) {
  await db().transaction('rw', db().modules, async () => {
    const mods = await db().modules.toArray()
    const byId = new Map(mods.map((m) => [m.id, m]))
    const merged: WorkModule[] = []
    for (const id of orderedModuleIds) {
      const m = byId.get(id)
      if (m) merged.push(m)
    }
    // append any missing (shouldn't happen)
    for (const m of mods) if (!orderedModuleIds.includes(m.id)) merged.push(m)

    // Normalize orders based on the NEW list sequence
    const normalized = merged.map((m, idx) => ({ ...m, order: idx, updatedAt: now() }))
    await db().modules.bulkPut(normalized)
  })
}

export async function createTask(
  moduleId: ModuleId,
  input: Pick<WorkTask, 'title' | 'detail'>,
) {
  const t = now()
  const title = input.title.trim()
  if (!title) throw new Error('任务名称不能为空')
  // New tasks default on top: smallest order among todo items minus 1
  const todo = await db()
    .tasks.where({ moduleId })
    .filter((x) => x.completedAt == null)
    .sortBy('order')
  const minOrder = todo[0]?.order ?? 0
  const task: WorkTask = {
    id: newId('task'),
    moduleId,
    title,
    detail: input.detail ?? '',
    order: minOrder - 1,
    createdAt: t,
    completedAt: null,
    updatedAt: t,
  }
  await db().tasks.add(task)
  return task
}

export async function updateTask(taskId: TaskId, patch: Partial<Pick<WorkTask, 'title' | 'detail'>>) {
  if (patch.title !== undefined && !patch.title.trim()) throw new Error('任务名称不能为空')
  await db()
    .tasks.update(taskId, {
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.detail !== undefined ? { detail: patch.detail } : {}),
      updatedAt: now(),
    })
}

export async function deleteTask(taskId: TaskId) {
  await db().tasks.delete(taskId)
}

export async function setTaskCompletion(taskId: TaskId, completed: boolean) {
  const t = now()
  await db().transaction('rw', db().tasks, async () => {
    const task = await db().tasks.get(taskId)
    if (!task) return

    if (completed) {
      const done = await db()
        .tasks.where({ moduleId: task.moduleId })
        .filter((x) => x.completedAt != null && x.id !== taskId)
        .sortBy('order')
      const maxOrder = done.length ? done[done.length - 1]!.order : -1
      await db().tasks.update(taskId, {
        completedAt: t,
        order: maxOrder + 1,
        updatedAt: t,
      })
      return
    }

    const todo = await db()
      .tasks.where({ moduleId: task.moduleId })
      .filter((x) => x.completedAt == null && x.id !== taskId)
      .sortBy('order')
    const minOrder = todo.length ? todo[0]!.order : 0
    await db().tasks.update(taskId, {
      completedAt: null,
      order: minOrder - 1,
      updatedAt: t,
    })
  })
}

export type TaskContainerKind = 'todo' | 'done'
export type TaskContainerId = `${TaskContainerKind}:${ModuleId}`

export function containerId(kind: TaskContainerKind, moduleId: ModuleId): TaskContainerId {
  return `${kind}:${moduleId}`
}

export async function moveAndReorderTask(input: {
  taskId: TaskId
  from: TaskContainerId
  to: TaskContainerId
  orderedTaskIdsInTo: TaskId[]
  orderedTaskIdsInFrom?: TaskId[]
}) {
  const t = now()
  const [, fromModuleId] = input.from.split(':') as [TaskContainerKind, ModuleId]
  const [toKind, toModuleId] = input.to.split(':') as [TaskContainerKind, ModuleId]
  const completedAt = toKind === 'done' ? t : null

  await db().transaction('rw', db().tasks, async () => {
    await db().tasks.update(input.taskId, {
      moduleId: toModuleId,
      completedAt,
      updatedAt: t,
    })

    const toTasks = await db()
      .tasks.where('id')
      .anyOf(input.orderedTaskIdsInTo)
      .toArray()
    const toById = new Map(toTasks.map((x) => [x.id, x]))
    const toNormalized = input.orderedTaskIdsInTo
      .map((id, idx) => toById.get(id) && ({ ...toById.get(id)!, order: idx, updatedAt: t }))
      .filter(Boolean) as WorkTask[]
    await db().tasks.bulkPut(toNormalized)

    if (input.orderedTaskIdsInFrom && input.from !== input.to) {
      const fromTasks = await db()
        .tasks.where('id')
        .anyOf(input.orderedTaskIdsInFrom)
        .toArray()
      const fromById = new Map(fromTasks.map((x) => [x.id, x]))
      const fromNormalized = input.orderedTaskIdsInFrom
        .map((id, idx) => fromById.get(id) && ({ ...fromById.get(id)!, order: idx, updatedAt: t }))
        .filter(Boolean) as WorkTask[]
      await db().tasks.bulkPut(fromNormalized)
    } else if (input.from !== input.to) {
      // Fallback: normalize "from" list for the source module
      const fromKind = input.from.split(':')[0] as TaskContainerKind
      const fromList = await db()
        .tasks.where({ moduleId: fromModuleId })
        .filter((x) => (fromKind === 'todo' ? x.completedAt == null : x.completedAt != null))
        .sortBy('order')
      const fromNormalized = fromList.map((x, idx) => ({ ...x, order: idx, updatedAt: t }))
      await db().tasks.bulkPut(fromNormalized)
    }
  })
}
