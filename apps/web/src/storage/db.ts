import Dexie, { type Table } from 'dexie'

export type ModuleId = string
export type TaskId = string

export type WorkModule = {
  id: ModuleId
  name: string
  color: string
  order: number
  createdAt: number
  updatedAt: number
}

export type WorkTask = {
  id: TaskId
  moduleId: ModuleId
  title: string
  detail: string
  order: number
  createdAt: number
  completedAt: number | null
  updatedAt: number
}

class TaskLedgerDb extends Dexie {
  modules!: Table<WorkModule, ModuleId>
  tasks!: Table<WorkTask, TaskId>

  constructor() {
    super('TaskLedger')
    this.version(1).stores({
      modules: 'id, order, createdAt, updatedAt',
      tasks: 'id, moduleId, order, createdAt, completedAt, updatedAt',
    })
  }
}

let _db: TaskLedgerDb | null = null

export function isIndexedDbSupported() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}

export function initDbOrThrow() {
  if (!isIndexedDbSupported()) throw new Error('IndexedDB not supported')
  if (_db) return _db
  _db = new TaskLedgerDb()
  return _db
}

export function db() {
  return initDbOrThrow()
}

