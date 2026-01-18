import { NavLink, Outlet } from 'react-router-dom'
import styles from './AppLayout.module.css'

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>TaskLedger</div>
        <nav className={styles.nav}>
          <NavLink
            to="/tasks"
            className={({ isActive }) => (isActive ? styles.active : styles.link)}
          >
            任务
          </NavLink>
          <NavLink
            to="/summary"
            className={({ isActive }) => (isActive ? styles.active : styles.link)}
          >
            汇总
          </NavLink>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

