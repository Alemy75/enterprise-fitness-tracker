import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_trainer/profile')({
  component: () => (
    <section>
      <h1>Профиль</h1>
      <p className="muted">Устройства, язык, выход — EFT-019, EFT-028.</p>
    </section>
  ),
});
