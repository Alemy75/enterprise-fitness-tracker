import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_trainer/clients')({
  component: () => (
    <section>
      <h1>Клиенты</h1>
      <p className="muted">Список и поиск клиентов — EFT-037.</p>
    </section>
  ),
});
