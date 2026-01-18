## TaskLedger

**TaskLedger** is a task management and review tool. Organize work into modules (lanes), drag and drop to reorder and move modules and tasks, and manage Todo/Done status. It also provides daily/weekly/monthly summaries to help you track and reflect on progress over time.

> End-user guide (for GitHub Releases): see `release/README.md`.

### Monorepo layout

- `apps/web`: Web app (React + IndexedDB)
- `apps/server`: Future server (placeholder for now)
- `packages/shared`: Future shared types/utils (placeholder for now)

### Dev

```bash
npm install
npm run dev
```

### Phase 1 (this repo now)

- **Task view**
  - Horizontal lanes = modules (name + color + draggable order)
  - Subtasks per module: title + detail + completion toggle
  - Completed tasks are collapsed by default; expand to view/drag into/out of done
  - Drag & drop: reorder modules, reorder tasks, move tasks between modules, toggle status by dragging between Todo/Done
- **Summary view**
  - Day/Week/Month aggregation starting from **2026-01**
  - Toggle: **completed** (by `completedAt`) vs **created but uncompleted** (by `createdAt`)
  - Calendar items show task title on the left and module name on the right, with module color as background

### Future direction

- **apps/server**
  - Sync across devices, history, collaboration
  - Generate day/week/month reports (optionally AI-assisted)
- **packages/shared**
  - Shared types + schema validations + migrations
  - Stable API contracts between web and server

