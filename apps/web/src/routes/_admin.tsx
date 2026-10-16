import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

/** Desktop layout for managers. Role check in `beforeLoad` arrives with EFT-141. */
export const Route = createFileRoute('/_admin')({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <Link to="/admin">Обзор</Link>
        <Link to="/today">К приложению тренера</Link>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
