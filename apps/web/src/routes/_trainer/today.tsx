import { HealthResponse } from '@eft/contracts';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

const apiHealthQuery = queryOptions({
  queryKey: ['api-health'],
  queryFn: async () => {
    const res = await fetch('/api/health');
    return HealthResponse.parse(await res.json());
  },
  networkMode: 'online',
});

export const Route = createFileRoute('/_trainer/today')({
  component: TodayPage,
});

function TodayPage() {
  const health = useQuery(apiHealthQuery);
  return (
    <section>
      <h1>Сегодня</h1>
      <p className="muted">Здесь будут клиенты и активные тренировки (EFT-037, EFT-056).</p>
      <dl className="status">
        <dt>API</dt>
        <dd>
          {health.isPending && health.fetchStatus === 'paused' && 'нет сети'}
          {health.isPending && health.fetchStatus === 'fetching' && 'проверка…'}
          {health.isError && 'недоступен'}
          {health.data && `${health.data.status}, версия ${health.data.version}`}
        </dd>
      </dl>
    </section>
  );
}
