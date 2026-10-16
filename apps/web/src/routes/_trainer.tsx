import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { useOnline } from '../hooks/use-online';

/** Mobile layout for trainers: content + bottom navigation (BACKLOG §8). */
export const Route = createFileRoute('/_trainer')({
  component: TrainerLayout,
});

const tabs = [
  { to: '/today', label: 'Сегодня' },
  { to: '/clients', label: 'Клиенты' },
  { to: '/programs', label: 'Программы' },
  { to: '/profile', label: 'Профиль' },
] as const;

function TrainerLayout() {
  const online = useOnline();
  return (
    <div className="trainer-shell">
      {!online && (
        <div className="offline-banner" role="status">
          Нет сети — данные сохраняются на устройстве
        </div>
      )}
      <main className="trainer-content">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Основная навигация">
        {tabs.map((tab) => (
          <Link key={tab.to} to={tab.to} activeProps={{ 'aria-current': 'page' }}>
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
