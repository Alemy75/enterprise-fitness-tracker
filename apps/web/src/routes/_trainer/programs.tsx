import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_trainer/programs')({
  component: () => (
    <section>
      <h1>Программы</h1>
      <p className="muted">Шаблоны программ — EFT-084.</p>
    </section>
  ),
});
