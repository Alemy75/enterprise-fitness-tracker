import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_admin/admin')({
  component: () => (
    <section>
      <h1>Администрирование</h1>
      <p className="muted">Клубы, персонал, каталог, журнал действий — E-02, E-10.</p>
    </section>
  ),
});
